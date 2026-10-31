"""Read-only Studio connection check. Never print credentials or raw account responses."""
import json
import os
from pathlib import Path
import urllib.request
import urllib.error

BASE = 'https://studio.voholabs.com/api/public/v1'


def request(path, payload=None):
    key = os.environ.get('MCQS_STUDIO_API_KEY', '')
    if not key:
        raise RuntimeError('MCQS_STUDIO_API_KEY is not available to this cloud job.')
    req = urllib.request.Request(BASE + path, data=None if payload is None else json.dumps(payload).encode(),
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
            entry['creatorInfo'] = request('/integration-trigger/' + channel['id'], {'methodName': 'creatorInfo', 'data': {}})
        safe.append(entry)
    output = {'connectedChannels': safe, 'prices': request('/wallet/prices'), 'wallet': request('/wallet')}
    path = Path('.social-automation/studio-connection.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps(output))


if __name__ == '__main__':
    main()
