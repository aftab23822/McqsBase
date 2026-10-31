"""Read-only Studio connection check. Never print credentials or raw account responses."""
import json
import os
import re
from pathlib import Path
import urllib.request
import urllib.error

BASE = 'https://studio.voholabs.com/api/public/v1'


def request(path, payload=None, method=None):
    key = os.environ.get('MCQS_STUDIO_API_KEY', '')
    if not key:
        raise RuntimeError('MCQS_STUDIO_API_KEY is not available to this cloud job.')
    req = urllib.request.Request(BASE + path, method=method, data=None if payload is None else json.dumps(payload).encode(),
        headers={'Authorization': key, 'Accept': 'application/json', 'Content-Type': 'application/json',
        'User-Agent': 'MCQsBase-Cloud-Publisher/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode('utf-8', errors='replace').lower()
        reason = next((x for x in ('invalid api key', 'invalid oauth token', 'no api key found',
            'insufficient', 'permission', 'cloudflare', 'not allowed', 'forbidden') if x in body), 'unclassified')
        raise RuntimeError(f'Studio {path} returned HTTP {error.code} ({reason}; '
            f'content type {error.headers.get("Content-Type", "unknown")}). No response body logged.') from None


def reconcile_approved_receipt(posts, api=request, proofs=None):
    """Metadata only: link the existing Reel after its missing comment was verified repaired."""
    post_id = 'cmvwcp8fl023yro9di7laeszq'
    if proofs is None:
        proofs = json.loads((Path(__file__).resolve().parents[1] / 'config/quiz-batch-public-proof.json').read_text())
    proof = proofs.get(post_id, {})
    matches = [post for post in posts if post['id'] == post_id]
    if (len(matches) != 1 or proof.get('sourceCommentId') != '1472595814813209'
            or proof.get('repairReleaseId') != '2269299303907745'
            or proof.get('integrationId') != 'cmvwb4faa021yro9dgcj8vlww'):
        raise ValueError('The explicitly verified Facebook comment repair evidence is missing.')
    post = matches[0]
    if (post.get('releaseId') != proof['repairReleaseId'] or
            post.get('integration', {}).get('id') != proof['integrationId']):
        raise ValueError('The provider receipt differs from the existing public Reel; no metadata update allowed.')
    if post['state'] == 'PUBLISHED':
        return 'Already reconciled; no write.'
    if post['state'] != 'ERROR':
        raise ValueError('Unexpected receipt state; hold instead of changing a queued post.')
    api('/posts/' + post_id + '/release-id', {'releaseId': proof['repairReleaseId']}, method='PUT')
    return 'Linked the already published Reel. No video was uploaded, scheduled or republished.'


def main():
    request('/is-connected')
    channels = request('/integrations')
    safe = []
    for channel in channels:
        if channel.get('identifier') not in ('facebook', 'instagram', 'instagram-standalone', 'tiktok', 'youtube'):
            continue
        entry = {key: channel.get(key) for key in ('id', 'name', 'identifier', 'profile', 'disabled',
            'internalId', 'providerId', 'accountId', 'username')}
        entry['availableFields'] = sorted(channel)
        entry['settings'] = request('/integration-settings/' + channel['id'])
        if channel['identifier'] == 'tiktok':
            creator = request('/integration-trigger/' + channel['id'], {'methodName': 'creatorInfo', 'data': {}})['output']
            entry['creatorInfo'] = {field: creator.get(field) for field in ('canPost', 'errorCode', 'nickname',
                'username', 'privacyLevelOptions', 'commentDisabled', 'maxVideoPostDurationSec')}
        entry['freeEstimate'] = request('/wallet/estimate', {'provider': channel['identifier'],
            'contents': ['MCQsBase quiz. https://www.mcqsbase.com/blog']})
        safe.append(entry)
    output = {'connectedChannels': safe, 'prices': request('/wallet/prices'), 'wallet': request('/wallet')}
    posts = request('/posts?startDate=2026-10-31T00%3A00%3A00Z&endDate=2026-11-01T00%3A00%3A00Z')['posts']
    if os.environ.get('RECONCILE_LAUNCH_RECEIPT') == 'true':
        if os.environ.get('GITHUB_EVENT_NAME') != 'workflow_dispatch':
            raise ValueError('Receipt repair is permitted only through an explicit manual dispatch.')
        output['receiptRepair'] = reconcile_approved_receipt(posts)
        posts = request('/posts?startDate=2026-10-31T00%3A00%3A00Z&endDate=2026-11-01T00%3A00%3A00Z')['posts']
    output['launchReceipts'] = []
    for post in posts:
        receipt = {field: post.get(field) for field in ('id', 'state', 'releaseURL', 'releaseId', 'publishDate')}
        receipt['availableFields'] = sorted(post)
        for field in ('error', 'lastError', 'reason'):
            value = post.get(field)
            if isinstance(value, str):
                value = value.replace(os.environ['MCQS_STUDIO_API_KEY'], '[redacted]')
                receipt[field] = re.sub(r'https?://\S+|(?:access_token|refresh_token)=[^\s&]+', '[redacted]', value)[:1000]
            elif isinstance(value, dict):
                receipt[field] = {key: value.get(key) for key in ('message', 'code', 'type', 'error_subcode')}
        output['launchReceipts'].append(receipt)
    for post in posts:
        if post.get('integration', {}).get('id') == 'cmvwbcule0222ro9dhocbic4w' and post.get('state') == 'PUBLISHED':
            try:
                candidates = request('/posts/' + post['id'] + '/missing')
                output['tiktokCandidates'] = [{field: item.get(field) for field in
                    ('id', 'releaseId', 'url', 'releaseURL', 'title', 'content', 'description', 'date', 'createdAt')}
                    for item in candidates]
            except RuntimeError as error:
                output['tiktokCandidateError'] = str(error)
            break
    path = Path('.social-automation/studio-connection.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps(output))


if __name__ == '__main__':
    main()
