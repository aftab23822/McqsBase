"""Host immutable public MP4s for Studio ingestion; preserve existing assets."""
import hashlib
from pathlib import Path
import re

TAG = 'mcqsbase-quiz-media'


def upload_video(storage, repository, slug, video):
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        raise ValueError('Invalid media slug.')
    data = Path(video).read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    filename = slug + '-' + digest[:16] + '.mp4'
    response = storage.http.get(storage.base + '/releases/tags/' + TAG, timeout=60)
    if response.status_code == 404:
        release = storage.api('POST', '/releases', json={
            'tag_name': TAG, 'target_commitish': 'master', 'name': 'MCQsBase quiz media',
            'body': 'Immutable public quiz video files for the MCQsBase Studio cloud handoff. '
                    'Assets prefixed make-draft-test are integration samples, not social publications.',
            'draft': False, 'prerelease': True, 'make_latest': 'false'})
    else:
        response.raise_for_status()
        release = response.json()
    if release.get('draft'):
        raise RuntimeError('Social schedulers cannot ingest media from a private draft release.')
    asset, page = None, 1
    while asset is None:
        assets = storage.api('GET', f'/releases/{release["id"]}/assets', params={'per_page': 100, 'page': page})
        asset = next((a for a in assets if a['name'] == filename), None)
        if asset or len(assets) < 100:
            break
        page += 1
    if asset is None:
        endpoint = release['upload_url'].split('{')[0]
        if endpoint != f'https://uploads.github.com/repos/{repository}/releases/{release["id"]}/assets':
            raise RuntimeError('Unexpected GitHub media upload endpoint.')
        uploaded = storage.http.post(endpoint, params={'name': filename}, data=data,
                                     headers={'Content-Type': 'video/mp4'}, timeout=120)
        uploaded.raise_for_status()
        asset = uploaded.json()
    expected_url = f'https://github.com/{repository}/releases/download/{TAG}/{filename}'
    if (asset.get('state') != 'uploaded' or asset.get('size') != len(data)
            or asset.get('digest') != 'sha256:' + digest
            or asset.get('browser_download_url') != expected_url):
        raise RuntimeError('The immutable public video asset failed its integrity check; do not overwrite it.')
    return {'videoUrl': expected_url, 'videoSha256': digest, 'assetId': asset['id']}
