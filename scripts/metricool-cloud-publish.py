"""PC-independent campaign handoff through authenticated Make and Metricool MCP only."""
import argparse
from datetime import datetime, timedelta
import importlib.util
import json
import os
from pathlib import Path
import subprocess
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


cloud = load('quiz_cloud', 'cloud-blog-videos.py')
bridge = load('quiz_make_bridge', 'metricool-make-client.py')
payload = load('quiz_metricool_payload', 'metricool-campaign-payload.py')
media = load('quiz_cloud_media', 'quiz-cloud-media.py')
POLICY = payload.social.POLICY


def now():
    return datetime.now(ZoneInfo(POLICY['timezone']))


def verify_brand(client):
    result = client.call('getBrandSettings')
    brands = result.get('data', []) if isinstance(result, dict) else result
    brand = next((b for b in brands if str(b.get('id')) == POLICY['metricoolBrandId']), {})
    expected = {network + 'Data': identity for network, identity in POLICY['networks'].items()}
    if (brand.get('timezone') != POLICY['timezone'] or brand.get('networksData') != expected):
        raise RuntimeError('Metricool account identities changed; hold all writes for review.')


def calendar(client, month):
    start = datetime.fromisoformat(month + '-01T00:00:00').replace(tzinfo=ZoneInfo(POLICY['timezone']))
    end = (start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(seconds=1)
    result = client.call('getScheduledPosts', {'brandId': POLICY['metricoolBrandId'],
        'fromDate': start.isoformat(), 'toDate': end.isoformat(), 'timezone': POLICY['timezone']})
    if not isinstance(result, dict) or not isinstance(result.get('data'), list):
        raise RuntimeError('The monthly Metricool calendar could not be reconciled; no writes allowed.')
    if any(key in result for key in ('nextPage', 'nextCursor', 'hasMore')):
        raise RuntimeError('The Metricool calendar may be incomplete; no writes allowed.')
    posts = result['data']
    if any(not post.get('id') or not post.get('uuid') or not isinstance(post.get('providers'), list) for post in posts):
        raise RuntimeError('The Metricool calendar contains an unverifiable post.')
    return posts


def find_post(posts, network, info, receipt):
    matches = []
    for post in posts:
        if not any(p.get('network') == network for p in post['providers']):
            continue
        if receipt.get('uuid'):
            matched = str(post['uuid']) == str(receipt['uuid'])
        else:
            matched = post.get('text') == info['text'] and post.get('draft', False) == info['draft']
        if matched:
            matches.append(post)
    if len(matches) > 1:
        raise RuntimeError('Multiple matching Metricool posts exist; hold the campaign to avoid a duplicate.')
    return matches[0] if matches else None


def verify_post(post, network, info):
    provider = next((p for p in post.get('providers', []) if p.get('network') == network), {})
    date = post.get('publicationDate', {})
    if (not post.get('id') or not post.get('uuid') or post.get('text') != info['text']
            or post.get('draft', False) != info['draft']
            or date.get('dateTime') != info['publicationDate']['dateTime']
            or date.get('timezone') != POLICY['timezone'] or not post.get('media')
            or (network == 'facebook' and post.get('firstCommentText', '') != info.get('firstCommentText', ''))
            or provider.get('status') in ('ERROR', 'FAILED', 'CANCELLED') or not provider):
        raise RuntimeError('Metricool returned a post that does not match the intended media, caption, date or comment.')
    return {'status': 'draft' if info['draft'] else 'published' if provider.get('status') == 'PUBLISHED' else 'scheduled',
            'postId': post['id'], 'uuid': str(post['uuid']), 'providerStatus': provider.get('status'),
            'scheduledFor': date, 'verifiedAt': now().isoformat(),
            'media': post['media'], 'publicUrl': provider.get('publicUrl')}


def apply_receipt(receipt, post, network, info, save):
    # Persist IDs even if a later content/status check fails. Never repeat the create.
    if post.get('id') and post.get('uuid'):
        receipt.update(postId=post['id'], uuid=str(post['uuid']))
        save()
    receipt.update(verify_post(post, network, info))
    save()


def send_missing(client, requests, ledger, posts, save):
    for network, arguments in requests.items():
        receipt = ledger['networks'][network]
        info = json.loads(arguments['info'])
        existing = find_post(posts, network, info, receipt)
        if existing:
            apply_receipt(receipt, existing, network, info, save)
            continue
        if receipt.get('status') != 'reserved':
            raise RuntimeError('An earlier write has no reconciled result. Hold it for review; never create it again.')
        receipt.update(status='uncertain', attemptedAt=now().isoformat())
        save()  # Durable intent MUST precede the only create request.
        result = client.call('createScheduledPost', arguments)
        post = result.get('data', result) if isinstance(result, dict) else {}
        if not isinstance(post, dict):
            raise RuntimeError('The create result is uncertain; reconcile the existing post before retrying.')
        apply_receipt(receipt, post, network, info, save)
        posts.append(post)
    # Verify each create against the platform calendar, not only its write response.
    fresh = calendar(client, ledger['month'])
    for network, arguments in requests.items():
        info = json.loads(arguments['info'])
        receipt = ledger['networks'][network]
        existing = find_post(fresh, network, info, receipt)
        if not existing:
            raise RuntimeError('Metricool has not confirmed the saved post in its calendar; preserve its receipt and retry verification.')
        apply_receipt(receipt, existing, network, info, save)


def check_capacity(state, month, posts):
    campaigns = state.get('campaigns', {}).get(month, {})
    reserved = sum(c.get('reservedPublications', 0) for c in campaigns.values())
    if len(campaigns) > POLICY['monthlyCampaignLimit'] or reserved > POLICY['monthlyPublicationBudget']:
        raise RuntimeError('The monthly campaign reservation budget has been exceeded.')
    active = {(str(post['uuid']), p['network']) for post in posts if not post.get('draft')
              for p in post['providers'] if p.get('status') != 'CANCELLED'}
    campaign_receipts = {(str(r['uuid']), network) for campaign in campaigns.values()
                         for network, r in campaign.get('networks', {}).items() if r.get('uuid')}
    # Count every reservation, including networks not yet sent and partial campaigns.
    # Existing/manual posts consume the four spare slots before they consume campaign capacity.
    total = len(active - campaign_receipts) + reserved
    if total > POLICY['monthlyPublicationBudget'] + POLICY['reservedPublications']:
        raise RuntimeError('Actual monthly Metricool usage leaves insufficient free-plan capacity. Hold this campaign.')


def decode_video(path):
    import imageio_ffmpeg
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path),
                    '-f', 'null', '-'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def campaign_requests(state, entry, manifest, url):
    # Uncertain/saved receipts may only reconcile; build their expected immutable request
    # separately while preserving their real status in the authoritative ledger.
    shadow = json.loads(json.dumps(state))
    current = shadow['articles'][entry['slug']]
    campaign = shadow['campaigns'][entry['campaign']['month']][str(entry['campaign']['window'])]
    current['campaign'] = campaign
    for receipt in campaign['networks'].values():
        receipt['status'] = 'reserved'
    return payload.build_requests(shadow, current, manifest, url, os.environ['GITHUB_REPOSITORY'])


def publish_campaign(storage, state, entry, client):
    campaign = state['campaigns'][entry['campaign']['month']][str(entry['campaign']['window'])]
    entry['campaign'] = campaign
    if campaign['month'] != now().strftime('%Y-%m'):
        raise RuntimeError('An expired campaign cannot spend a different month’s publication slots.')
    package = entry.get('cloudPackage')
    if not package:
        run_id = int(entry['artifactRunUrl'].rstrip('/').split('/')[-1])
        directory = media.download_package(storage, run_id, entry['slug'],
            ROOT / '.social-automation/make-handoff/packages' / entry['slug'])
        manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
        payload.validate_package(entry, manifest)
        proof_run = storage.api('GET', f'/actions/runs/{manifest["productionDeployment"]["publisherRunId"]}')
        if (proof_run.get('name') != 'Daily Blog Autopilot' or proof_run.get('head_branch') != 'master'
                or proof_run.get('conclusion') != 'success'):
            raise RuntimeError('The package’s publisher run is not a verified successful daily blog publication.')
        decode_video(directory / 'mcqsbase-quiz.mp4')
        package = media.upload_video(storage, os.environ['GITHUB_REPOSITORY'], entry['slug'], directory / 'mcqsbase-quiz.mp4')
        package.update(manifest=manifest, decodedSuccessfully=True)
        entry['cloudPackage'] = package
        campaign['videoUrl'] = package['videoUrl']
        storage.save(state)
    manifest = package['manifest']
    payload.validate_package(entry, manifest)
    verify_brand(client)
    posts = calendar(client, campaign['month'])
    check_capacity(state, campaign['month'], posts)
    target = datetime.fromisoformat(campaign['scheduledFor'])
    if target <= now():
        replacement = payload.social.publication_window(now())
        if (not replacement or replacement['month'] != campaign['month'] or replacement['window'] != campaign['window']
                or any(r.get('status') == 'uncertain' for r in campaign['networks'].values())):
            raise RuntimeError('The reserved publication date expired; hold it rather than moving outside its window.')
        campaign['scheduledFor'] = replacement['scheduledFor']
        storage.save(state)
    requests = campaign_requests(state, entry, manifest, package['videoUrl'])
    send_missing(client, requests, campaign, posts, lambda: storage.save(state))
    statuses = {r['status'] for r in campaign['networks'].values()}
    campaign['status'] = 'published' if statuses == {'published'} else 'scheduled'
    entry['publishingStatus'] = campaign['status']
    storage.save(state)
    print(f'Campaign {campaign["id"]}: all four Metricool receipts verified ({campaign["status"]}).')


def draft_test(storage, state, client):
    test_key = 'make-cloud-draft-v1'
    tests = state.setdefault('integrationTests', {})
    ledger = tests.get(test_key)
    if ledger and ledger.get('status') == 'verified':
        print('The cloud draft test already passed; no duplicate drafts were created.')
        return
    if not ledger:
        directory = media.download_package(storage, 40322819350, 'university-of-sindh-entry-test-mcqs',
            ROOT / '.social-automation/make-handoff/draft-test', sample=True)
        manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
        if not 0 < manifest['durationSeconds'] <= 89 or not 1 <= manifest['count'] <= 5:
            raise RuntimeError('The draft sample does not fit the shared Shorts limits.')
        decode_video(directory / 'mcqsbase-quiz.mp4')
        asset = media.upload_video(storage, os.environ['GITHUB_REPOSITORY'], 'make-draft-test', directory / 'mcqsbase-quiz.mp4')
        instant = now()
        scheduled = (instant + timedelta(days=1)).replace(hour=20, minute=0, second=0, microsecond=0)
        captions = payload.social.social_copy(manifest['title'], manifest['count'], manifest['sourceUrl'])
        ledger = {'id': test_key, 'month': scheduled.strftime('%Y-%m'), 'status': 'testing',
                  'scheduledFor': scheduled.isoformat(), 'videoUrl': asset['videoUrl'],
                  'networks': {network: {'status': 'reserved', 'account': identity} for network, identity in POLICY['networks'].items()},
                  'requests': {}}
        for network, caption in captions.items():
            info = {'autoPublish': True, 'draft': True, 'media': [asset['videoUrl']],
                    'providers': [{'network': network}],
                    'text': '[AUTOMATION DRAFT TEST — DO NOT PUBLISH]\n' + caption['text'],
                    'publicationDate': {'dateTime': scheduled.strftime('%Y-%m-%dT%H:%M:%S'), 'timezone': POLICY['timezone']}}
            if network == 'facebook':
                info.update(facebookData={'type': 'REEL', 'title': caption['title']}, firstCommentText=caption['firstCommentText'])
            elif network == 'instagram':
                info['instagramData'] = {'type': 'REEL', 'showReelOnFeed': True, 'isAiGenerated': True}
            elif network == 'youtube':
                info['youtubeData'] = {'type': 'short', 'privacy': 'public', 'title': caption['title'],
                    'category': 'EDUCATION', 'madeForKids': False, 'isAiGeneratedContent': True}
            else:
                info['tiktokData'] = {'privacyOption': 'PUBLIC_TO_EVERYONE', 'isAigc': True}
            ledger['requests'][network] = {'blogId': POLICY['metricoolBrandId'], 'date': scheduled.isoformat(),
                                            'info': json.dumps(info, ensure_ascii=False)}
        tests[test_key] = ledger
        storage.save(state)
    verify_brand(client)
    posts = calendar(client, ledger['month'])
    send_missing(client, ledger['requests'], ledger, posts, lambda: storage.save(state))
    ledger['status'] = 'verified'
    storage.save(state)
    print('All four cloud video drafts, captions, source fields and calendar receipts verified. No test post was published.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--draft-test', action='store_true')
    args = parser.parse_args()
    storage = cloud.GitHubState(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN'])
    state = storage.load()
    if args.draft_test:
        draft_test(storage, state, bridge.MakeClient())
        return
    entries = [entry for entry in state.get('articles', {}).values()
               if entry.get('status') == 'ready' and entry.get('campaign')
               and entry.get('publishingStatus') != 'published']
    if not entries:
        print('No selected campaign awaits a Metricool handoff. No social calls or video work performed.')
        return
    client = bridge.MakeClient()
    for entry in entries:
        publish_campaign(storage, state, entry, client)


if __name__ == '__main__':
    try:
        main()
    except bridge.BridgeError as error:
        raise SystemExit(str(error)) from None
