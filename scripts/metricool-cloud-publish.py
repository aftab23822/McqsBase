"""PC-independent campaign handoff through authenticated Make and Metricool MCP only."""
import argparse
from datetime import datetime, timedelta
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urlsplit
from urllib.request import urlopen
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
    def minute(value):
        try:
            return datetime.fromisoformat(value).replace(second=0, microsecond=0)
        except (TypeError, ValueError):
            return None
    if (not post.get('id') or not post.get('uuid') or post.get('text') != info['text']
            or post.get('draft', False) != info['draft']
            or minute(date.get('dateTime')) != minute(info['publicationDate']['dateTime'])
            or date.get('timezone') != POLICY['timezone'] or len(post.get('media', [])) != 1
            or post.get('autoPublish') is not True
            or (network == 'facebook' and post.get('firstCommentText', '') != info.get('firstCommentText', ''))
            or provider.get('status') in ('ERROR', 'FAILED', 'CANCELLED') or not provider):
        raise RuntimeError('Metricool returned a post that does not match the intended media, caption, date or comment.')
    data_key = network + 'Data'
    expected_type = info.get(data_key, {}).get('type')
    if expected_type and post.get(data_key, {}).get('type') != expected_type:
        raise RuntimeError('Metricool did not retain the intended Reel or Short format.')
    result = {'status': 'draft' if info['draft'] else 'published' if provider.get('status') == 'PUBLISHED' else 'scheduled',
            'postId': post['id'], 'uuid': str(post['uuid']), 'providerStatus': provider.get('status'),
            'scheduledFor': date, 'verifiedAt': now().isoformat(),
            'media': post['media'], 'publicUrl': provider.get('publicUrl')}
    if network == 'facebook':
        result.update(firstCommentText=post.get('firstCommentText'),
                      firstCommentStatus='awaiting-public-verification' if provider.get('status') == 'PUBLISHED'
                                         else 'configured-with-post')
    return result


def verify_media_bytes(posts, ledger, digest):
    checked = set()
    for receipt in ledger['networks'].values():
        matching = next((post for post in posts if str(post['uuid']) == str(receipt.get('uuid'))), None)
        if not matching or len(matching.get('media', [])) != 1:
            raise RuntimeError('The campaign video is missing from Metricool.')
        url = matching['media'][0]
        if url in checked:
            continue
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != 'static.metricool.com' or parsed.username:
            raise RuntimeError('Metricool did not ingest the video into its expected media service.')
        try:
            with urlopen(url, timeout=45) as response:
                data = response.read(50_000_001)
        except Exception:
            raise RuntimeError('The ingested Metricool video could not be verified yet.') from None
        if len(data) > 50_000_000 or hashlib.sha256(data).hexdigest() != digest:
            raise RuntimeError('The ingested video does not match the validated quiz file.')
        checked.add(url)


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
    _, seconds = imageio_ffmpeg.count_frames_and_secs(str(path))
    if not 0 < seconds <= POLICY['maxDurationSeconds'] + 1 / 24:
        raise RuntimeError('The actual decoded video exceeds the shared Shorts limit.')


def campaign_requests(state, entry, manifest, url, validation_instant=None):
    # Uncertain/saved receipts may only reconcile; build their expected immutable request
    # separately while preserving their real status in the authoritative ledger.
    shadow = json.loads(json.dumps(state))
    current = shadow['articles'][entry['slug']]
    campaign = shadow['campaigns'][entry['campaign']['month']][str(entry['campaign']['window'])]
    current['campaign'] = campaign
    for receipt in campaign['networks'].values():
        receipt['status'] = 'reserved'
    requests = payload.build_requests(shadow, current, manifest, url, os.environ['GITHUB_REPOSITORY'], validation_instant)
    for network, receipt in entry['campaign']['networks'].items():
        if receipt.get('scheduledFor'):
            info = json.loads(requests[network]['info'])
            info['publicationDate'] = receipt['scheduledFor']
            requests[network]['info'] = json.dumps(info, ensure_ascii=False)
    return requests


def adopt_approved_launch(storage, state):
    """Bind the explicitly approved sample to its deployed source and one campaign.

    This is a single named exception to baseline exclusion, not a backfill queue.
    Existing draft UUIDs are adopted; no new social posts are created here.
    """
    approval = json.loads((ROOT / 'config/quiz-approved-launch.json').read_text(encoding='utf-8'))
    slug = approval['slug']
    existing = state.get('articles', {}).get(slug, {})
    if existing.get('campaign'):
        return
    slot = payload.social.publication_window(now())
    if not slot or slot['month'] != approval['month'] or slot['window'] != approval['window']:
        return
    test = state.get('integrationTests', {}).get(approval['integrationTestId'], {})
    if test.get('status') != 'verified':
        raise RuntimeError('The approved launch cannot proceed until all four draft checks pass.')
    if str(approval['window']) in state.get('campaigns', {}).get(approval['month'], {}):
        raise RuntimeError('The approved launch window is already reserved by another campaign.')
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    proof = cloud.production_deployment(storage, sha)
    runs = storage.api('GET', '/actions/workflows/daily-blog-autopilot.yml/runs',
                       params={'branch': 'master', 'per_page': 1})['workflow_runs']
    if not runs or runs[0].get('conclusion') != 'success':
        raise RuntimeError('The existing daily publisher has not completed successfully; hold the launch.')
    proof['publisherRunId'] = runs[0]['id']
    source = cloud.deployed_sources(proof, state)['packages'][slug]
    directory = media.download_package(storage, approval['sampleRunId'], slug,
        ROOT / '.social-automation/make-handoff/approved-launch', sample=True)
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    def question_signature(question):
        return (question.get('question'), tuple(question.get('choices', [])), question.get('correctIndex'))
    published_questions = {question_signature(q) for q in source['questions']}
    if (manifest.get('sourceTitle') != source['title'] or manifest.get('sourceUrl') != source['url']
            or not manifest.get('questions')
            or any(question_signature(q) not in published_questions for q in manifest['questions'])):
        raise RuntimeError('The sample questions do not exactly match the deployed article; do not publish it.')
    manifest.update(sourceContentHash=source['contentHash'], sourceVerification='production-deployment',
                    sourceFetchedAt=source['fetchedAt'], productionDeployment=proof,
                    verificationNote='Previously rendered CI sample, revalidated against the exact Production article after explicit user publication approval.')
    entry = existing
    entry.update(slug=slug, url=source['url'], status='ready', sourceTitle=source['title'],
                 previousQueueStatus=existing.get('status', 'baseline'), approvedDraftLaunch=True,
                 launchIntegrationTestId=approval['integrationTestId'],
                 publishingStatus='awaiting-metricool-scheduling', userApproval=approval['authorization'])
    state.setdefault('articles', {})[slug] = entry
    campaign = payload.social.reserve_campaign(state, entry, now())
    if not campaign:
        raise RuntimeError('No campaign capacity remains for the approved launch.')
    # The user approved a live test. Leave time for cloud validation and four updates.
    target = (now() + timedelta(minutes=10)).replace(second=0, microsecond=0)
    if target.strftime('%Y-%m') != campaign['month']:
        raise RuntimeError('Do not move the launch outside its reserved month.')
    campaign['scheduledFor'] = target.isoformat()
    campaign['selectionReason'] = 'Explicit user approval to publish the already-tested video.'
    for network, receipt in campaign['networks'].items():
        draft = test['networks'][network]
        if draft.get('status') != 'draft' or not draft.get('postId') or not draft.get('uuid'):
            raise RuntimeError('The approved launch is missing a verified existing draft receipt.')
        receipt.update(status='approved-draft', postId=draft['postId'], uuid=draft['uuid'])
    payload.validate_package(entry, manifest)
    decode_video(directory / 'mcqsbase-quiz.mp4')
    package = media.upload_video(storage, os.environ['GITHUB_REPOSITORY'], slug, directory / 'mcqsbase-quiz.mp4')
    package.update(manifest=manifest, decodedSuccessfully=True)
    entry['cloudPackage'] = package
    campaign['videoUrl'] = package['videoUrl']
    test['status'] = 'launch-in-progress'
    storage.save(state)


def promote_approved_drafts(client, requests, campaign, posts, save):
    for network, arguments in requests.items():
        receipt = campaign['networks'][network]
        info = json.loads(arguments['info'])
        original = next((p for p in posts if str(p['uuid']) == str(receipt.get('uuid'))), None)
        if not original:
            raise RuntimeError('An approved draft disappeared; do not replace it with a new post.')
        if not original.get('draft'):
            apply_receipt(receipt, original, network, info, save)
            continue
        if receipt.get('status') != 'approved-draft':
            raise RuntimeError('An earlier draft update is uncertain; reconcile it before any further update.')
        updated = {**original, **info, 'providers': original['providers'], 'media': original['media']}
        for key in ('facebookData', 'instagramData', 'tiktokData', 'youtubeData'):
            if isinstance(original.get(key), dict) and isinstance(info.get(key), dict):
                updated[key] = {**original[key], **info[key]}
        # Calendar reads include default data for unrelated networks. MCP writes
        # reject those defaults; retain all other original fields and the chosen
        # provider's complete configuration.
        for other in ('twitter', 'facebook', 'instagram', 'linkedin', 'pinterest', 'youtube',
                      'tiktok', 'bluesky', 'threads', 'gmb'):
            if other != network:
                updated.pop(other + 'Data', None)
        receipt.update(status='uncertain-update', attemptedAt=now().isoformat())
        save()
        result = client.call('updateScheduledPost', {'blogId': POLICY['metricoolBrandId'],
            'id': str(original['id']), 'uuid': str(original['uuid']), 'info': json.dumps(updated, ensure_ascii=False)})
        post = result.get('data', result) if isinstance(result, dict) else {}
        if not isinstance(post, dict):
            raise RuntimeError('The draft update has no verified receipt; reconcile it before another write.')
        apply_receipt(receipt, post, network, info, save)


def recover_confirmed_launch_rejection(campaign, posts, save):
    approval = json.loads((ROOT / 'config/quiz-approved-launch.json').read_text(encoding='utf-8'))
    evidence = approval.get('confirmedRejectedUpdate', {})
    if campaign.get('slug') != approval['slug'] or campaign.get('month') != approval['month']:
        return
    for receipt in campaign['networks'].values():
        if receipt.get('status') != 'uncertain-update' or receipt.get('rejectionRecoveryApplied'):
            continue
        original = next((post for post in posts if str(post['uuid']) == str(receipt.get('uuid'))), {})
        if (str(receipt.get('uuid')) == evidence.get('uuid')
                and original.get('id') == evidence.get('originalPostId') and original.get('draft') is True):
            receipt.update(status='approved-draft', rejectionRecoveryApplied=True,
                           confirmedRejectedExecution=evidence['executionId'], rejectionReason=evidence['reason'])
            save()


def publish_campaign(storage, state, entry, client):
    campaign = state['campaigns'][entry['campaign']['month']][str(entry['campaign']['window'])]
    entry['campaign'] = campaign
    verification_only = all(r.get('status') in ('scheduled', 'published') and r.get('postId') and r.get('uuid')
                            for r in campaign['networks'].values())
    if campaign['month'] != now().strftime('%Y-%m') and not verification_only:
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
    if package.get('decodedSuccessfully') is not True:
        raise RuntimeError('The campaign video has no completed decode verification.')
    payload.validate_package(entry, manifest)
    verify_brand(client)
    posts = calendar(client, campaign['month'])
    if entry.get('approvedDraftLaunch'):
        recover_confirmed_launch_rejection(campaign, posts, lambda: storage.save(state))
    target = datetime.fromisoformat(campaign['scheduledFor'])
    # Reconcile saved/uncertain writes before quota calculations or changing an
    # expired date. Historical validation here builds expectations only; the
    # regular future-date guard still runs before any new request is sent.
    expectations = campaign_requests(state, entry, manifest, package['videoUrl'], target - timedelta(seconds=1))
    for network, receipt in campaign['networks'].items():
        expected_info = json.loads(expectations[network]['info'])
        original = find_post(posts, network, expected_info, receipt)
        if original and not original.get('draft'):
            apply_receipt(receipt, original, network, expected_info,
                           lambda: storage.save(state))
    verification_only = all(r.get('status') in ('scheduled', 'published') and r.get('postId') and r.get('uuid')
                            for r in campaign['networks'].values())
    if not verification_only:
        check_capacity(state, campaign['month'], posts)
    if target <= now() and not verification_only:
        replacement = payload.social.publication_window(now())
        if (not replacement or replacement['month'] != campaign['month'] or replacement['window'] != campaign['window']
                or any(r.get('status', '').startswith('uncertain') for r in campaign['networks'].values())):
            raise RuntimeError('The reserved publication date expired; hold it rather than moving outside its window.')
        campaign['scheduledFor'] = ((now() + timedelta(minutes=10)).replace(second=0, microsecond=0).isoformat()
                                    if entry.get('approvedDraftLaunch') else replacement['scheduledFor'])
        storage.save(state)
    requests = campaign_requests(state, entry, manifest, package['videoUrl'],
                                  target - timedelta(seconds=1) if verification_only else None)
    def save():
        if entry.get('launchIntegrationTestId'):
            test = state['integrationTests'][entry['launchIntegrationTestId']]
            test['networks'] = campaign['networks']
        storage.save(state)
    if entry.get('approvedDraftLaunch'):
        promote_approved_drafts(client, requests, campaign, posts, save)
        posts = calendar(client, campaign['month'])
    send_missing(client, requests, campaign, posts, save)
    verify_media_bytes(calendar(client, campaign['month']), campaign, package['videoSha256'])
    statuses = {r['status'] for r in campaign['networks'].values()}
    campaign['status'] = 'published' if statuses == {'published'} else 'scheduled'
    entry['publishingStatus'] = campaign['status']
    if entry.get('launchIntegrationTestId'):
        state['integrationTests'][entry['launchIntegrationTestId']]['status'] = 'promoted'
    storage.save(state)
    print(f'Campaign {campaign["id"]}: all four Metricool receipts verified ({campaign["status"]}).')


def draft_test(storage, state, client):
    test_key = 'make-cloud-draft-v1'
    tests = state.setdefault('integrationTests', {})
    ledger = tests.get(test_key)
    if ledger and ledger.get('status') in ('verified', 'promoted', 'launch-in-progress'):
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
                  'videoSha256': asset['videoSha256'],
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
                info['tiktokData'] = {'title': caption['title'], 'privacyOption': 'PUBLIC_TO_EVERYONE', 'isAigc': True}
            ledger['requests'][network] = {'blogId': POLICY['metricoolBrandId'], 'date': scheduled.isoformat(),
                                            'info': json.dumps(info, ensure_ascii=False)}
        tests[test_key] = ledger
        storage.save(state)
    verify_brand(client)
    posts = calendar(client, ledger['month'])
    send_missing(client, ledger['requests'], ledger, posts, lambda: storage.save(state))
    # The first test version predated storage of the hash; its immutable filename
    # and GitHub release asset provide the full digest for safe recovery.
    digest = ledger.get('videoSha256')
    if not digest:
        release = storage.api('GET', '/releases/tags/mcqsbase-quiz-media')
        asset = next(a for a in release['assets'] if a['browser_download_url'] == ledger['videoUrl'])
        digest = asset['digest'].removeprefix('sha256:')
        ledger['videoSha256'] = digest
    verify_media_bytes(calendar(client, ledger['month']), ledger, digest)
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
    adopt_approved_launch(storage, state)
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
