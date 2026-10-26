"""Hosted video generation with durable GitHub state. Metricool handles publishing.

This worker creates videos only. It never calls Facebook or schedules a social
post. Metricool is the sole publishing provider.
"""
import base64
import importlib.util
import json
import os
from pathlib import Path
import re

import requests

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('watcher', ROOT / 'scripts/watch-blog-videos.py')
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)
STATE_BRANCH = 'codex/blog-video-state'


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


def main():
    repository, token = os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN']
    storage = GitHubState(repository, token)
    state = storage.load()
    directory = ROOT / '.social-automation/blog-videos'
    directory.mkdir(parents=True, exist_ok=True)
    state_file = directory / 'state.json'
    watcher.save_json(state_file, state)
    storage.save(state)
    args = type('Options', (), {'state_dir': str(directory), 'count': 10, 'max_videos': 1,
                               'voice_engine': 'kokoro',
                               'kokoro_model': str(ROOT / '.social-automation/voices/kokoro/kokoro-v1.0.fp16.onnx'),
                               'kokoro_voices': str(ROOT / '.social-automation/voices/kokoro/voices-v1.0.bin')})()
    watcher.run(args)
    state = json.loads(state_file.read_text(encoding='utf-8'))
    run_url = f'https://github.com/{repository}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    for entry in state.get('articles', {}).values():
        if entry.get('status') == 'ready' and entry.get('publishingStatus') != 'scheduled':
            entry['publishingStatus'] = 'awaiting-metricool-scheduling'
            entry['metricoolBrandId'] = '7661098'
            entry.setdefault('artifactRunUrl', run_url)
    watcher.save_json(state_file, state)
    storage.save(state)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        ready = [e for e in state.get('articles', {}).values() if e.get('status') == 'ready']
        lines = ['## MCQsBase blog quiz videos', '',
                 'Video generation runs on GitHub. Publishing is handled separately by Metricool.', '']
        lines.extend(f'- {e.get("sourceTitle", e["slug"])}: {e.get("publishingStatus", "ready")}' for e in ready)
        Path(summary).write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
