"""Free Studio REST client and resumable four-network scheduling. No credential logging."""
from datetime import datetime, timedelta, timezone
import hashlib
import html
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = 'https://studio.voholabs.com/api/public/v1'
NETWORKS = ('facebook', 'instagram', 'tiktok', 'youtube')
PROOF_FILE = Path(__file__).resolve().parents[1] / 'config/quiz-batch-public-proof.json'
PUBLIC_PROOFS = json.loads(PROOF_FILE.read_text(encoding='utf-8')) if PROOF_FILE.exists() else {}


def post_url(network, url):
    parsed = urllib.parse.urlparse(url or '')
    if parsed.scheme != 'https':
        return False
    host = parsed.netloc.lower().removeprefix('www.')
    if network == 'tiktok':
        return host == 'tiktok.com' and bool(re.fullmatch(r'/@mcqsbase/video/\d+/?', parsed.path, re.I))
    if network == 'instagram':
        return host == 'instagram.com' and bool(re.fullmatch(r'/(reel|p)/[\w-]+/?', parsed.path))
    if network == 'youtube':
        return host == 'youtube.com' and (bool(re.fullmatch(r'/shorts/[\w-]{11}/?', parsed.path))
            or parsed.path == '/watch' and bool(re.fullmatch(r'[\w-]{11}', urllib.parse.parse_qs(parsed.query).get('v', [''])[0])))
    return host == 'facebook.com' and bool(re.search(r'/(reel|videos|posts)/[\w-]+', parsed.path))


class StudioError(RuntimeError):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)


class Studio:
    def __init__(self, key=None):
        self.key = key if key is not None else os.environ['MCQS_STUDIO_API_KEY']
        if not self.key:
            raise ValueError('The cloud Studio secret is missing.')

    def call(self, method, path, payload=None):
        if not path.startswith('/') or '://' in path:
            raise ValueError('Only the fixed Studio API is allowed.')
        req = urllib.request.Request(BASE + path, method=method,
            data=None if payload is None else json.dumps(payload).encode(), headers={
                'Authorization': self.key, 'Accept': 'application/json',
                'Content-Type': 'application/json', 'User-Agent': 'MCQsBase-Cloud-Publisher/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=180) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            # A validation error can help repair a payload; never include a key or raw response.
            body = error.read().decode('utf-8', errors='replace').replace(self.key, '[redacted]')
            try:
                parsed = json.loads(body)
                detail = parsed.get('message', parsed.get('msg', parsed.get('error', 'request rejected')))
                if not isinstance(detail, str):
                    detail = 'request rejected; inspect the provider calendar'
            except (ValueError, AttributeError):
                detail = 'non-JSON response; inspect service availability'
            detail = re.sub(r'https?://\S+', '[URL]', detail)[:450]
            raise StudioError(error.code, f'Studio HTTP {error.code}: {detail}') from None
        except (urllib.error.URLError, TimeoutError):
            raise RuntimeError('Studio transport outcome is uncertain; reconcile before any retry.') from None

    def posts(self, start, end):
        query = urllib.parse.urlencode({'startDate': start, 'endDate': end})
        result = self.call('GET', '/posts?' + query)
        if not isinstance(result.get('posts'), list):
            raise RuntimeError('Studio did not return a verifiable calendar.')
        return result['posts']


def connected(studio, policy):
    wallet = studio.call('GET', '/wallet')
    if (wallet.get('usesWallet') is not True or wallet.get('payAsYouGo') is not False
            or wallet.get('autoTopUp', {}).get('enabled') is not False or wallet.get('frozen')):
        raise ValueError('The expected free workspace without automatic payments could not be verified.')
    actual = studio.call('GET', '/integrations')
    result = {}
    for network, expected in policy['channels'].items():
        found = [channel for channel in actual if channel['id'] == expected['id']]
        if len(found) != 1 or found[0].get('disabled'):
            raise ValueError(f'The verified {network} channel is absent or disabled.')
        channel = found[0]
        if any(str(channel.get(key, '')).lower() != str(expected[key]).lower()
               for key in ('name', 'profile', 'identifier')):
            raise ValueError(f'The {network} account identity has changed; hold publication.')
        rules = studio.call('GET', '/integration-settings/' + channel['id'])['output']
        if not isinstance(rules.get('settings'), dict):
            raise ValueError(f'The {network} posting schema is unavailable.')
        result[network] = {**expected, 'rules': rules}
    creator = studio.call('POST', '/integration-trigger/' + result['tiktok']['id'],
                         {'methodName': 'creatorInfo', 'data': {}})['output']
    if isinstance(creator, str):
        creator = json.loads(creator)
    # Helpers can wrap TikTok's standard response in data.
    while isinstance(creator, dict) and isinstance(creator.get('data'), dict):
        creator = creator['data']
    if (creator.get('canPost') is not True or creator.get('username', '').lower() != 'mcqsbase'
            or 'PUBLIC_TO_EVERYONE' not in creator.get('privacyLevelOptions', [])
            or creator.get('maxVideoPostDurationSec', 0) < policy['maxDurationSeconds']):
        raise ValueError('TikTok does not currently allow automatic public posts for this account.')
    result['tiktok']['creator'] = creator
    return result


def text_only(value):
    return ' '.join(html.unescape(re.sub('<[^>]+>', ' ', value)).split())


def post_item(network, channel, caption, media):
    content = caption['text']
    if caption['sourceUrl'] not in content:
        content += '\nFull practice set: ' + caption['sourceUrl']
    if len(content) > channel['rules']['maxLength']:
        raise ValueError(f'The {network} caption is over its current limit.')
    value = [{'content': content, 'image': [{'id': media['id'], 'path': media['path']}]}]
    settings = {'__type': channel['identifier']}
    if network == 'facebook':
        settings.update(post_type='post', title=caption['title'][:100])
        value.append({'content': caption['firstCommentText'], 'image': [], 'delay': 0})
    elif network == 'instagram':
        settings.update(post_type='post', is_trial_reel=False)
    elif network == 'youtube':
        settings.update(title=caption['title'][:100], type='public', selfDeclaredMadeForKids='no',
                        tags=[{'value': tag.lstrip('#'), 'label': tag.lstrip('#')} for tag in caption['hashtags']])
    elif network == 'tiktok':
        settings.update(title=caption['title'][:90], content_posting_method='DIRECT_POST',
                        privacy_level='PUBLIC_TO_EVERYONE', duet=False, stitch=False,
                        comment=not channel.get('creator', {}).get('commentDisabled', False), autoAddMusic='no',
                        brand_organic_toggle=True, brand_content_toggle=False, disclose=True, video_made_with_ai=True)
    schema = channel['rules']['settings']
    for required in schema.get('required', []):
        if required not in settings:
            raise ValueError(f'The {network} settings require {required}.')
    for key, rule in schema.get('properties', {}).items():
        if key in settings and 'enum' in rule and settings[key] not in rule['enum']:
            raise ValueError(f'The {network} setting {key} is no longer supported.')
    return {'integration': {'id': channel['id']}, 'settings': settings, 'value': value}


def assert_free(studio, item):
    estimate = studio.call('POST', '/wallet/estimate', {'provider': item['settings']['__type'],
        'contents': [value['content'] for value in item['value']]})
    if estimate.get('usesWallet') is not True:
        raise ValueError('The expected Free pay-as-you-go workspace could not be verified.')
    if (estimate.get('charged') is not False or estimate.get('priceCredits', 0) != 0
            or estimate.get('dueCredits', 0) != 0):
        raise ValueError('This post is no longer free; no paid publication is permitted.')


def reconcile(part, posts, channels):
    """Recover known or uncertain writes by exact account + caption; never create duplicates."""
    for network, item in part.get('payloads', {}).items():
        receipts = part.setdefault('receipts', {})
        receipt = receipts.get(network, {})
        expected = text_only(item['value'][0]['content'])
        matches = [post for post in posts
                   if post.get('integration', {}).get('id') == channels[network]['id']
                   and text_only(post.get('content', '')) == expected]
        if len(matches) > 1:
            raise RuntimeError(f'Duplicate calendar matches for part {part["part"]} {network}; hold.')
        if not matches:
            if receipt.get('postId') or receipt.get('status') == 'uncertain':
                raise RuntimeError(f'Part {part["part"]} {network} has an uncertain or missing receipt; do not recreate it.')
            continue
        post = matches[0]
        if receipt.get('postId') and post['id'] != receipt['postId']:
            raise RuntimeError('Unexpected Studio post ID; hold rather than create another post.')
        state = post.get('state')
        if state not in ('QUEUE', 'PUBLISHED', 'ERROR', 'DRAFT'):
            raise RuntimeError('Unrecognized provider status; hold publication.')
        if state == 'PUBLISHED' and not post.get('releaseURL'):
            raise RuntimeError('Studio claims publication without a public receipt.')
        if state != 'PUBLISHED':
            actual = datetime.fromisoformat(post['publishDate'].replace('Z', '+00:00'))
            planned = datetime.fromisoformat(part['scheduledAt'])
            if abs((actual - planned).total_seconds()) > 60:
                raise RuntimeError('Provider changed the saved publication time; hold.')
        url, proof = post.get('releaseURL'), PUBLIC_PROOFS.get(post['id'])
        if (proof and proof['integrationId'] == channels[network]['id']
                and proof['videoSha256'] == part.get('sha256')
                and proof['sourceUrl'] == part['captions'][network]['sourceUrl']):
            url = proof['url']
        verified = state == 'PUBLISHED' and post_url(network, url)
        receipts[network] = {**receipt, 'postId': post['id'], 'status': state,
            'url': url, 'providerUrl': post.get('releaseURL'), 'providerReleaseId': post.get('releaseId'),
            'publicUrlVerified': verified, 'verification': proof['method'] if verified and proof else
                'provider-post-url' if verified else 'provider-status-only', 'integrationId': channels[network]['id']}


def schedule_batch(studio, record, channels, save, slots):
    if record.get('status') not in ('ready', 'scheduling', 'scheduled', 'published') or len(record.get('parts', [])) != 5:
        raise ValueError('All five videos must be ready before any post can be scheduled.')
    # Validate every network's complete payload before releasing any part to the scheduler.
    for part in record['parts']:
        part.setdefault('payloads', {network: post_item(network, channels[network], part['captions'][network], part['studioMedia'])
                                     for network in NETWORKS})
    if not record.get('schedule'):
        record['schedule'] = slots
        for part, when in zip(record['parts'], slots):
            part['scheduledAt'] = when
        save(record)  # Freeze the entire same-day plan before the first write.
    days = {datetime.fromisoformat(when).date() for when in record['schedule']}
    if len(days) != 1 or len(record['schedule']) != 5:
        raise ValueError('The persisted batch is not a complete same-day plan.')
    start = (datetime.fromisoformat(record['schedule'][0]) - timedelta(days=1)).isoformat()
    end = (datetime.fromisoformat(record['schedule'][-1]) + timedelta(days=1)).isoformat()
    for part in record['parts']:
        part.setdefault('payloads', {network: post_item(network, channels[network], part['captions'][network], part['studioMedia'])
                                     for network in NETWORKS})
        reconcile(part, studio.posts(start, end), channels)
        save(record)
        missing = [network for network in NETWORKS if not part.get('receipts', {}).get(network)
                   or part['receipts'][network].get('status') == 'rejected']
        if not missing:
            continue
        if datetime.fromisoformat(part['scheduledAt']) <= datetime.now(timezone.utc) + timedelta(minutes=2):
            raise ValueError('The reserved same-day slot has passed; keep receipts and hold missing networks.')
        for network in missing:
            part['payloads'][network] = post_item(network, channels[network], part['captions'][network], part['studioMedia'])
            assert_free(studio, part['payloads'][network])
        record['status'] = 'scheduling'
        for network in missing:
            part.setdefault('receipts', {})[network] = {'status': 'uncertain', 'attemptedAt': datetime.now(timezone.utc).isoformat()}
        save(record)  # Durable intent before a possibly uncertain network request.
        payload = {'type': 'schedule', 'date': datetime.fromisoformat(part['scheduledAt']).astimezone(timezone.utc).isoformat(),
                   'shortLink': False, 'tags': [], 'creationMethod': 'API',
                   'posts': [part['payloads'][network] for network in missing]}
        try:
            results = studio.call('POST', '/posts', payload)
        except StudioError as error:
            if error.status in (400, 401, 402, 403, 413, 429):
                # Definitive rejection: retain the intent and require reconciliation on recovery.
                record['lastError'] = str(error)
            if error.status == 400:
                # Documented validation failure creates no posts. Recovery still reconciles first.
                for network in missing:
                    part['receipts'][network]['status'] = 'rejected'
            save(record)
            raise
        for returned in results:
            network = next((name for name in missing if channels[name]['id'] == returned.get('integration')), None)
            if not network or not returned.get('postId'):
                raise RuntimeError('Unexpected create response; reconcile the saved uncertain intent before retrying.')
            part['receipts'][network].update(postId=returned['postId'], status='accepted')
            save(record)  # Preserve every partial success immediately.
        reconcile(part, studio.posts(start, end), channels)
        save(record)
    receipts = [receipt for part in record['parts'] for receipt in part.get('receipts', {}).values()]
    if len(receipts) != 20 or any(receipt['status'] not in ('QUEUE', 'PUBLISHED') for receipt in receipts):
        raise RuntimeError('Some networks need attention; successful receipts have been preserved.')
    all_published = all(receipt['status'] == 'PUBLISHED' for receipt in receipts)
    record['status'] = ('published' if all(r.get('publicUrlVerified') for r in receipts) else
                        'provider-published') if all_published else 'scheduled'
    save(record)
    return record
