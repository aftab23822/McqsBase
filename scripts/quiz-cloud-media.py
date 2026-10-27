"""Recover quiz packages and host immutable public MP4s for Metricool ingestion."""
import hashlib
from io import BytesIO
from pathlib import Path
import re
from zipfile import ZipFile

TAG = 'mcqsbase-quiz-media'
FILES = {'mcqsbase-quiz.mp4', 'manifest.json', 'platform-captions.json', 'preview.png', 'reveal-preview.png'}


def download_package(storage, run_id, slug, destination, sample=False):
    run = storage.api('GET', f'/actions/runs/{int(run_id)}')
    if run.get('name') != 'Blog Quiz Videos' or run.get('conclusion') != 'success':
        raise RuntimeError('Only a successful quiz workflow can supply a video package.')
    if not sample and run.get('head_branch') != 'master':
        raise RuntimeError('Production videos must come from the master workflow.')
    artifacts = storage.api('GET', f'/actions/runs/{int(run_id)}/artifacts')['artifacts']
    name = 'cloud-quiz-smoke' if sample else f'blog-quiz-videos-{int(run_id)}'
    candidates = [a for a in artifacts if a['name'] == name and not a['expired']]
    if len(candidates) != 1 or candidates[0]['size_in_bytes'] > 50_000_000:
        raise RuntimeError('The original quiz package is missing, expired or unexpectedly large; do not regenerate blindly.')
    response = storage.http.get(storage.base + f'/actions/artifacts/{candidates[0]["id"]}/zip', timeout=90)
    response.raise_for_status()
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    with ZipFile(BytesIO(response.content)) as archive:
        for basename in FILES:
            matches = [n for n in archive.namelist() if Path(n).name == basename
                       and (sample or '/' not in n or slug in n.split('/'))]
            if len(matches) != 1:
                raise RuntimeError('The original video package is incomplete or ambiguous.')
            record = archive.getinfo(matches[0])
            if record.file_size > 50_000_000:
                raise RuntimeError('The video package contains an unexpectedly large file.')
            (destination / basename).write_bytes(archive.read(matches[0]))
    return destination


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
            'body': 'Immutable public quiz video files for the MCQsBase Metricool cloud handoff. '
                    'Assets prefixed make-draft-test are integration samples, not social publications.',
            'draft': False, 'prerelease': True, 'make_latest': 'false'})
    else:
        response.raise_for_status()
        release = response.json()
    if release.get('draft'):
        raise RuntimeError('Metricool cannot ingest media from a private draft release.')
    assets = storage.api('GET', f'/releases/{release["id"]}/assets', params={'per_page': 100})
    asset = next((a for a in assets if a['name'] == filename), None)
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
