"""Hosted queue with durable GitHub state and optional direct Facebook publishing.

The default creates videos only. Facebook writes require both an explicit enable
flag and a Page token stored as a repository secret. No browser session is used.
"""
import base64
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import re
import time

import requests

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('watcher', ROOT / 'scripts/watch-blog-videos.py')
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)
STATE_BRANCH = 'codex/blog-video-state'
PAGE_ID = '851782721355178'


def portable_state(state):
    result = json.loads(json.dumps(state))
    result.pop('lastCheckedAt', None)
    for entry in result.get('articles', {}).values():
        entry.pop('video', None)
        entry.pop('manifest', None)
    return result


class GitHubState:
    def __init__(self, repository, token):
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
            raise ValueError('Invalid GitHub repository.')
        self.base = f'https://api.github.com/repos/{repository}'
        self.http = requests.Session()
        self.http.headers.update({'Authorization': f'Bearer {token}',
                                  'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'})
        self.sha = None
        self.previous = None
        self.loaded = False

    def api(self, method, path, **kwargs):
        response = self.http.request(method, self.base + path, timeout=60, **kwargs)
        response.raise_for_status()
        return response.json()

    def load(self):
        response = self.http.get(self.base + '/contents/state.json', params={'ref': STATE_BRANCH}, timeout=60)
        if response.status_code == 404:
            # A missing branch is an initial run. A missing file on an existing
            # branch is a state-loss error; never silently reset its baseline.
            branch = self.http.get(self.base + '/git/ref/heads/' + STATE_BRANCH, timeout=60)
            if branch.status_code != 404:
                branch.raise_for_status()
                raise RuntimeError('State branch exists but its queue is missing; restore it before publishing.')
            seed = json.loads((ROOT / 'config/blog-video-state-seed.json').read_text(encoding='utf-8'))
            self.loaded = True
            return seed
        response.raise_for_status()
        record = response.json()
        state = json.loads(base64.b64decode(record['content']))
        self.sha = record['sha']
        self.previous = portable_state(state)
        self.loaded = True
        return state

    def save(self, state):
        if not self.loaded:
            raise RuntimeError('Load durable state before saving it.')
        state = portable_state(state)
        if state == self.previous:
            return
        content = json.dumps(state, ensure_ascii=False, indent=2)
        if self.sha is None:
            tree = self.api('POST', '/git/trees', json={'tree': [
                {'path': 'state.json', 'mode': '100644', 'type': 'blob', 'content': content},
                {'path': 'vercel.json', 'mode': '100644', 'type': 'blob',
                 'content': '{"git":{"deploymentEnabled":false}}'}]})
            commit = self.api('POST', '/git/commits', json={
                'message': 'Initialize quiz video queue [skip ci]', 'tree': tree['sha'], 'parents': []})
            self.api('POST', '/git/refs', json={'ref': 'refs/heads/' + STATE_BRANCH, 'sha': commit['sha']})
            record = self.api('GET', '/contents/state.json', params={'ref': STATE_BRANCH})
        else:
            result = self.api('PUT', '/contents/state.json', json={
                'message': 'Update quiz video queue [skip ci]', 'branch': STATE_BRANCH, 'sha': self.sha,
                'content': base64.b64encode(content.encode()).decode()})
            record = result['content']
        self.sha = record['sha']
        self.previous = state


class FacebookPublisher:
    def __init__(self, token, version, checkpoint, session=None):
        if not re.fullmatch(r'v\d+\.\d+', version or ''):
            raise ValueError('Set FACEBOOK_GRAPH_VERSION to the supported Graph API version chosen in your Meta app.')
        self.base = f'https://graph.facebook.com/{version}'
        self.http = session or requests.Session()
        self.http.headers.update({'Authorization': f'Bearer {token}'})
        self.checkpoint = checkpoint

    def request(self, method, path, **kwargs):
        response = self.http.request(method, self.base + '/' + path, timeout=180, **kwargs)
        response.raise_for_status()
        data = response.json()
        if data.get('error'):
            raise RuntimeError('Facebook rejected the request; inspect the app permissions and Page token.')
        return data

    def publish(self, entry, directory):
        identity = self.request('GET', 'me', params={'fields': 'id,name'})
        if identity.get('id') != PAGE_ID:
            raise ValueError('The token does not belong to the confirmed McqsBase Facebook Page.')
        caption = (directory / 'caption.txt').read_text(encoding='utf-8').strip()
        comment = (directory / 'first-comment.txt').read_text(encoding='utf-8').strip()
        manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
        if not manifest.get('sourceVerifiedLive') or manifest.get('sourceUrl') != entry['url']:
            raise ValueError('Refusing to publish a video without a verified matching live source.')
        if not entry.get('facebookVideoId'):
            recent = self.request('GET', PAGE_ID + '/videos', params={
                'fields': 'id,description,created_time', 'limit': 100})
            matches = [video for video in recent.get('data', []) if video.get('description', '').strip() == caption]
            if len(matches) > 1:
                raise RuntimeError('Multiple matching videos found; resolve duplicates before proceeding.')
            if matches:
                entry['facebookVideoId'] = matches[0]['id']
                self.checkpoint()
            elif entry.get('facebookUploadIntentAt'):
                raise RuntimeError('A previous upload outcome is uncertain. No second upload will be attempted automatically.')
            else:
                entry.update(facebookUploadIntentAt=watcher.now(), publishingStatus='uploading')
                self.checkpoint()  # Durable before the external write.
                with (directory / 'mcqsbase-quiz.mp4').open('rb') as video_file:
                    response = self.request('POST', PAGE_ID + '/videos',
                        data={'title': manifest['title'], 'description': caption, 'published': 'true'},
                        files={'source': ('mcqsbase-quiz.mp4', video_file, 'video/mp4')})
                entry.update(facebookVideoId=response['id'], publishingStatus='processing')
                self.checkpoint()
        video_id = entry['facebookVideoId']
        video = self.request('GET', video_id, params={'fields': 'id,status,permalink_url'})
        status = video.get('status', {})
        if status.get('video_status') != 'ready' or status.get('publishing_phase', {}).get('status') != 'complete':
            entry['publishingStatus'] = 'processing'
            self.checkpoint()
            return  # Next hosted check reconciles processing; never re-upload.
        entry['facebookUrl'] = video.get('permalink_url', '')
        if not entry.get('facebookCommentId'):
            comments = self.request('GET', video_id + '/comments', params={'fields': 'id,message,from', 'limit': 100})
            own = [item for item in comments.get('data', []) if item.get('message', '').strip() == comment
                   and item.get('from', {}).get('id') == PAGE_ID]
            if own:
                entry['facebookCommentId'] = own[0]['id']
                self.checkpoint()
            elif entry.get('facebookCommentIntentAt'):
                raise RuntimeError('A previous comment outcome is uncertain; inspect it before another comment is attempted.')
            else:
                entry['facebookCommentIntentAt'] = watcher.now()
                self.checkpoint()
                result = self.request('POST', video_id + '/comments', data={'message': comment})
                entry['facebookCommentId'] = result['id']
                self.checkpoint()
        confirmed = self.request('GET', entry['facebookCommentId'], params={'fields': 'id,message'})
        if confirmed.get('message', '').strip() != comment:
            raise RuntimeError('The source-link comment could not be verified.')
        entry.update(publishingStatus='published', publishedAt=watcher.now())
        self.checkpoint()


def main():
    repository, token = os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN']
    storage = GitHubState(repository, token)
    state = storage.load()
    directory = ROOT / '.social-automation/blog-videos'
    directory.mkdir(parents=True, exist_ok=True)
    state_file = directory / 'state.json'
    facebook_token = os.environ.get('FACEBOOK_PAGE_ACCESS_TOKEN', '')
    publish_enabled = os.environ.get('FACEBOOK_AUTO_PUBLISH', '').lower() == 'true'
    for slug, entry in state.get('articles', {}).items():
        if (publish_enabled and facebook_token and entry.get('status') == 'ready'
                and entry.get('publishingStatus') not in ('scheduled', 'published')):
            entry['status'] = 'retry'  # Restore an ephemeral runner's missing video deterministically.
    watcher.save_json(state_file, state)
    storage.save(state)
    args = type('Options', (), {'state_dir': str(directory), 'count': 10, 'max_videos': 1,
                               'voice_engine': 'piper',
                               'piper_model': str(ROOT / '.social-automation/voices/en_US-ljspeech-medium.onnx')})()
    watcher.run(args)
    state = json.loads(state_file.read_text(encoding='utf-8'))

    def checkpoint():
        watcher.save_json(state_file, state)
        storage.save(state)

    run_url = f'https://github.com/{repository}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    for entry in state.get('articles', {}).values():
        if entry.get('status') == 'ready' and entry.get('publishingStatus') != 'scheduled' and not entry.get('artifactRunUrl'):
            entry['artifactRunUrl'] = run_url
    checkpoint()
    failures = []
    if publish_enabled:
        if not facebook_token:
            raise RuntimeError('Facebook publishing is enabled but FACEBOOK_PAGE_ACCESS_TOKEN is missing.')
        publisher = FacebookPublisher(facebook_token, os.environ.get('FACEBOOK_GRAPH_VERSION'), checkpoint)
        for slug, entry in state.get('articles', {}).items():
            if entry.get('status') != 'ready' or entry.get('publishingStatus') in ('scheduled', 'published'):
                continue
            video_dir = directory / 'videos' / slug
            if not (video_dir / 'manifest.json').exists():
                continue
            try:
                publisher.publish(entry, video_dir)
            except Exception as error:
                safe_message = str(error).replace(facebook_token, '[redacted]').replace(token, '[redacted]')
                entry['publishingError'] = safe_message
                failures.append(slug)
                checkpoint()
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        ready = [e for e in state.get('articles', {}).values() if e.get('status') == 'ready']
        lines = ['## MCQsBase blog quiz videos', '',
                 'Facebook auto-publishing: ' + ('enabled' if publish_enabled else 'not enabled; one-time Page authorization required'), '']
        lines.extend(f'- {e.get("sourceTitle", e["slug"])}: {e.get("publishingStatus", "ready")}' for e in ready)
        Path(summary).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    if failures:
        raise RuntimeError('Facebook publication needs attention for: ' + ', '.join(failures))


if __name__ == '__main__':
    main()
