"""Read-only Studio connection check. Never print credentials or raw account responses."""
import json
import os
from pathlib import Path
import urllib.request
import urllib.error

BASE = 'https://studio.voholabs.com/api/public/v1'


def request(path):
    key = os.environ.get('MCQS_STUDIO_API_KEY', '')
    if not key:
        raise RuntimeError('MCQS_STUDIO_API_KEY is not available to this cloud job.')
    req = urllib.request.Request(BASE + path, headers={'Authorization': key, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Studio read failed with HTTP {error.code}; no response body logged.') from None


def main():
    request('/is-connected')
    channels = request('/integrations')
    safe = []
    for channel in channels:
        if channel.get('identifier') not in ('facebook', 'instagram', 'instagram-standalone', 'tiktok', 'youtube'):
            continue
        entry = {key: channel.get(key) for key in ('id', 'name', 'identifier', 'profile', 'disabled')}
        entry['settings'] = request('/integration-settings/' + channel['id'])
        safe.append(entry)
    output = {'connectedChannels': safe, 'prices': request('/wallet/prices')}
    path = Path('.social-automation/studio-connection.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps(output))


if __name__ == '__main__':
    main()
