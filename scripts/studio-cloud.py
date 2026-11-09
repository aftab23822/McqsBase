"""Free Studio REST client and resumable four-network scheduling. No credential logging."""
from datetime import datetime, timedelta, timezone
import hashlib
import html
import json
import os
import random
from pathlib import Path
import re
import time
from email.utils import parsedate_to_datetime
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


class NoCredentialRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None  # Never forward the cloud credential to a redirect target.


class Studio:
    def __init__(self, key=None, open_request=None, sleep=time.sleep):
        self.key = (key if key is not None else os.environ.get('MCQS_STUDIO_API_KEY', '')).strip()
        if not self.key:
            raise ValueError('The cloud Studio secret is missing.')
        self.open_request = open_request or urllib.request.build_opener(NoCredentialRedirect()).open
        self.sleep = sleep

    def upload_video(self, filename, data):
        import requests
        response = requests.post(BASE + '/upload', headers={'Authorization': self.key},
                                 files={'file': (filename, data, 'video/mp4')},
                                 allow_redirects=False, timeout=180)
        if not 200 <= response.status_code < 300:
            raise StudioError(response.status_code, f'Studio file upload returned HTTP {response.status_code}.')
        return response.json()

    def call(self, method, path, payload=None):
        if not path.startswith('/') or '://' in path:
            raise ValueError('Only the fixed Studio API is allowed.')
        req = urllib.request.Request(BASE + path, method=method,
            data=None if payload is None else json.dumps(payload).encode(), headers={
                'Authorization': self.key, 'Accept': 'application/json',
                'Content-Type': 'application/json', 'User-Agent': 'MCQsBase-Cloud-Publisher/1.0'})
        # POST /posts and media imports are deliberately NOT retried. Their outcome
        # can be uncertain; the durable ledger/calendar must reconcile them first.
        safe_read = method == 'GET' or (method == 'POST' and (
            path == '/wallet/estimate' or (path.startswith('/integration-trigger/')
            and payload and payload.get('methodName') == 'creatorInfo')))
        for attempt in range(3 if safe_read else 1):
            try:
                with self.open_request(req, timeout=90) as response:
                    return json.load(response)
            except urllib.error.HTTPError as error:
                status, headers = error.code, error.headers
                body = error.read().decode('utf-8', errors='replace').replace(self.key, '[redacted]')
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                if safe_read and attempt < 2:
                    self.sleep(2 ** attempt + random.random())
                    continue
                raise RuntimeError('Studio connection failed. Saved work is preserved; reconcile before retrying any write.') from None
            except (ValueError, UnicodeDecodeError):
                if safe_read and attempt < 2:
                    self.sleep(2 ** attempt + random.random())
                    continue
                raise StudioError(502, 'Studio returned an unreadable response; saved work is preserved.') from None
            if safe_read and status in (408, 429, 500, 502, 503, 504) and attempt < 2:
                retry_after = headers.get('Retry-After', '') if headers else ''
                try:
                    delay = float(retry_after)
                except ValueError:
                    try:
                        delay = (parsedate_to_datetime(retry_after) - datetime.now(timezone.utc)).total_seconds()
                    except (TypeError, ValueError, OverflowError):
                        delay = 2 ** attempt + random.random()
                if delay > 60:
                    raise StudioError(status, 'Studio requested a longer wait; defer recovery without repeating writes.') from None
                self.sleep(max(0, delay))
                continue
            # A validation error can help repair a payload; never include a key or raw response.
            try:
                parsed = json.loads(body)
                detail = parsed.get('message', parsed.get('msg', parsed.get('error', 'request rejected')))
                if not isinstance(detail, str):
                    detail = 'request rejected; inspect the provider calendar'
            except (ValueError, AttributeError):
                detail = 'non-JSON response; inspect service availability'
            if status in (401, 403):
                detail = 'Cloud API access was rejected; inspect the Studio connection/key. Browser sign-in alone does not renew this credential.'
            detail = re.sub(r'https?://\S+', '[URL]', detail)[:450]
            raise StudioError(status, f'Studio HTTP {status}: {detail}') from None

    def posts(self, start, end):
        query = urllib.parse.urlencode({'startDate': start, 'endDate': end})
        result = self.call('GET', '/posts?' + query)
        if not isinstance(result.get('posts'), list):
            raise RuntimeError('Studio did not return a verifiable calendar.')
        return result['posts']


def connected(studio, policy, verify_only=False):
    if not verify_only:
        wallet = studio.call('GET', '/wallet')
        if (wallet.get('usesWallet') is not True or wallet.get('payAsYouGo') is not False
                or wallet.get('autoTopUp', {}).get('enabled') is not False or wallet.get('frozen')):
            raise ValueError('The expected free workspace without automatic payments could not be verified.')
    actual = studio.call('GET', '/integrations')
    if not isinstance(actual, list):
        raise ValueError('Studio returned an unreadable channel list; no publication allowed.')
    result = {}
    for network, expected in policy['channels'].items():
        result[network] = {**expected, 'identityVerified': False}
        try:
            found = [channel for channel in actual if channel.get('id') == expected['id']]
            if len(found) != 1:
                raise ValueError(f'The verified {network} channel is absent; reconnect the existing account.')
            channel = found[0]
            if any(str(channel.get(key, '')).lower() != str(expected[key]).lower()
                   for key in ('name', 'profile', 'identifier')):
                raise ValueError(f'The {network} account identity changed; verify the original account.')
            result[network]['identityVerified'] = True
            if verify_only:
                continue  # Reading old receipts needs neither posting permission nor wallet estimates.
            if channel.get('disabled'):
                raise ValueError(f'The {network} channel is disabled; reconnect or enable the existing channel.')
            rules = studio.call('GET', '/integration-settings/' + channel['id'])['output']
            if not isinstance(rules.get('settings'), dict):
                raise ValueError(f'The {network} posting schema is unavailable.')
            result[network]['rules'] = rules
            if network != 'tiktok':
                continue
            def creator_info():
                value = studio.call('POST', '/integration-trigger/' + channel['id'],
                                    {'methodName': 'creatorInfo', 'data': {}})['output']
                if isinstance(value, str):
                    value = json.loads(value)
                while isinstance(value, dict) and isinstance(value.get('data'), dict):
                    value = value['data']
                return value
            creator = creator_info()
            if (isinstance(creator, dict) and creator.get('canPost') is not True
                    and creator.get('errorCode') in ('access_token_invalid', 'access_token_expired', 'invalid_token')):
                # Studio's creator helper currently bypasses its refresh handler.
                # Its documented free analytics route checks stored expiry and
                # invokes the server-side refresh service, even before its cache.
                # Tokens stay inside Studio. An empty analytics result is NOT
                # evidence of recovery: query creator info again and verify it.
                result[network]['authRecovery'] = 'attempted-studio-renewal'
                studio.call('GET', '/analytics/' + channel['id'] + '?date=1&fresh=true')
                creator = creator_info()
                if isinstance(creator, dict) and creator.get('canPost') is True:
                    result[network]['authRecovery'] = 'creator-verified-after-studio-renewal'
            if not isinstance(creator, dict):
                raise ValueError('TikTok account details are unavailable; reconnect the existing channel.')
            code = str(creator.get('errorCode', ''))
            code = code if re.fullmatch(r'[A-Za-z0-9_.-]{1,80}', code) else 'unavailable'
            if creator.get('canPost') is not True:
                raise ValueError(f'TikTok cannot load or post for this account (code={code}); inspect/reconnect its existing Studio channel.')
            if creator.get('username', '').lower() != 'mcqsbase':
                raise ValueError('TikTok creator identity differs from the approved account; verify the connection.')
            if 'PUBLIC_TO_EVERYONE' not in creator.get('privacyLevelOptions', []):
                raise ValueError('TikTok does not allow Everyone visibility; hold public posting.')
            if creator.get('maxVideoPostDurationSec', 0) < policy['maxDurationSeconds']:
                raise ValueError('TikTok currently allows a shorter video duration; hold this channel.')
            result[network]['creator'] = creator
        except (StudioError, ValueError, KeyError, TypeError, RuntimeError) as error:
            result[network]['blockedReason'] = str(error)
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
        # Meta can return a Reel ID before it accepts comments against that ID.
        value.append({'content': caption['firstCommentText'], 'image': [], 'delay': 1})
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


def reconcile(part, posts, channels, only_network=None):
    """Recover known or uncertain writes by exact account + caption; never create duplicates."""
    for network, item in part.get('payloads', {}).items():
        if only_network and network != only_network:
            continue
        if channels[network].get('identityVerified') is False:
            continue
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
        provider_state = state
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
        proof_applied = False
        if (proof and proof['integrationId'] == channels[network]['id']
                and proof['videoSha256'] == part.get('sha256')
                and proof['sourceUrl'] == part['captions'][network]['sourceUrl']):
            url = proof['url']
            proof_applied = True
        if (state == 'ERROR' and proof_applied and proof.get('resolvedProviderError') is True
                and proof.get('sourceCommentId') and proof.get('repairReleaseId') == post.get('releaseId')
                and post_url(network, url)):
            # One explicitly verified comment-only repair may resolve a stale scheduler flag.
            # Keep the actual provider error visible; never retry the already public video.
            state = 'PUBLISHED'
        verified = state == 'PUBLISHED' and post_url(network, url)
        receipts[network] = {**receipt, 'postId': post['id'], 'status': state,
            'url': url, 'providerUrl': post.get('releaseURL'), 'providerReleaseId': post.get('releaseId'),
            'providerStatus': provider_state,
            'publicUrlVerified': verified, 'verification': proof['method'] if verified and proof_applied else
                'provider-post-url' if verified else 'provider-status-only', 'integrationId': channels[network]['id']}
        if proof_applied and proof.get('sourceCommentId'):
            receipts[network]['sourceCommentId'] = proof['sourceCommentId']
            receipts[network]['sourceCommentVerified'] = True


def schedule_batch(studio, record, channels, save, slots):
    if record.get('status') not in ('ready', 'scheduling', 'partially-scheduled', 'scheduled', 'published', 'provider-published') or len(record.get('parts', [])) != 5:
        raise ValueError('All five videos must be ready before any post can be scheduled.')
    blocked = {}

    def hold(network, reason):
        blocked[network] = str(reason)
        for part in record['parts']:
            receipts = part.setdefault('receipts', {})
            prior = receipts.get(network, {})
            if not prior.get('postId') and prior.get('status') != 'uncertain':
                receipts[network] = {'status': 'blocked', 'reason': str(reason)}
        record['blockedNetworks'] = dict(blocked)
        save(record)

    # Check all five payloads per network first. One expired token or changed
    # schema must not suppress the other three approved, free destinations.
    for network in NETWORKS:
        if all(part.get('receipts', {}).get(network, {}).get('postId')
               and part['receipts'][network].get('status') in ('QUEUE', 'PUBLISHED')
               for part in record['parts']):
            continue  # Existing posts can be reconciled without permission to make new ones.
        if channels[network].get('blockedReason'):
            hold(network, channels[network]['blockedReason'])
            continue
        try:
            prepared = [post_item(network, channels[network], part['captions'][network], part['studioMedia'])
                        for part in record['parts']]
            for part, item in zip(record['parts'], prepared):
                part.setdefault('payloads', {}).setdefault(network, item)
        except (ValueError, KeyError, TypeError) as error:
            hold(network, error)
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
        posts = studio.posts(start, end)
        for network in NETWORKS:
            try:
                reconcile(part, posts, channels, only_network=network)
            except (RuntimeError, ValueError, KeyError, TypeError) as error:
                hold(network, error)
                continue
            save(record)
            receipt = part.get('receipts', {}).get(network, {})
            if receipt.get('status') == 'ERROR':
                hold(network, 'An existing provider post failed; repair its saved ID without recreating the video.')
                continue
            if receipt.get('postId') or receipt.get('status') not in (None, 'blocked', 'rejected'):
                continue
            if network in blocked:
                continue
            if datetime.fromisoformat(part['scheduledAt']) <= datetime.now(timezone.utc) + timedelta(minutes=2):
                hold(network, 'The reserved same-day slot passed; retain receipts and request recovery of missing posts only.')
                continue
            try:
                assert_free(studio, part['payloads'][network])
            except (StudioError, ValueError, RuntimeError) as error:
                hold(network, error)
                continue
            record['status'] = 'scheduling'
            part.setdefault('receipts', {})[network] = {'status': 'uncertain', 'attemptedAt': datetime.now(timezone.utc).isoformat()}
            save(record)  # One durable network intent before each possibly uncertain write.
            payload = {'type': 'schedule', 'date': datetime.fromisoformat(part['scheduledAt']).astimezone(timezone.utc).isoformat(),
                       'shortLink': False, 'tags': [], 'creationMethod': 'API', 'posts': [part['payloads'][network]]}
            try:
                results = studio.call('POST', '/posts', payload)
                if (not isinstance(results, list) or len(results) != 1
                        or results[0].get('integration') != channels[network]['id'] or not results[0].get('postId')):
                    raise RuntimeError('Unexpected create response; reconcile the saved uncertain intent before retrying.')
                part['receipts'][network].update(postId=results[0]['postId'], status='accepted')
                save(record)
                reconcile(part, studio.posts(start, end), channels, only_network=network)
                save(record)
            except (StudioError, RuntimeError) as error:
                if isinstance(error, StudioError) and error.status == 400:
                    part['receipts'][network]['status'] = 'rejected'
                hold(network, error)  # Preserve uncertain/post IDs, then continue healthy destinations.
    receipts = [receipt for part in record['parts'] for receipt in part.get('receipts', {}).values()]
    if blocked or len(receipts) != 20 or any(receipt['status'] not in ('QUEUE', 'PUBLISHED') for receipt in receipts):
        incomplete = [part for part in record['parts'] if any(
            part.get('receipts', {}).get(n, {}).get('status') not in ('QUEUE', 'PUBLISHED') for n in NETWORKS)]
        expired = incomplete and all(datetime.fromisoformat(p['scheduledAt']) <= datetime.now(timezone.utc) + timedelta(minutes=2)
                                     for p in incomplete)
        record['status'] = 'publication-needs-attention' if expired else 'partially-scheduled'
        record['blockedNetworks'] = blocked
        record['lastError'] = 'Some networks need attention; successful receipts have been preserved.'
        save(record)
        raise RuntimeError(record['lastError'] + ' ' + '; '.join(f'{n}: {r}' for n, r in blocked.items()))
    record.pop('blockedNetworks', None)
    record.pop('lastError', None)
    all_published = all(receipt['status'] == 'PUBLISHED' for receipt in receipts)
    record['status'] = ('published' if all(r.get('publicUrlVerified') for r in receipts) else
                        'provider-published') if all_published else 'scheduled'
    save(record)
    return record
