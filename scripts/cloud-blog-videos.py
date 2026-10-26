"""Hosted video generation with durable GitHub state. Metricool handles publishing.

This worker creates videos only. It never calls Facebook or schedules a social
post. Metricool is the sole publishing provider.
"""
import base64
import importlib.util
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

import requests

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('watcher', ROOT / 'scripts/watch-blog-videos.py')
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)
STATE_BRANCH = 'codex/blog-video-state'
social = watcher.renderer.social


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


def successful_blog_run(storage):
    """Manual recovery also requires a successful daily publisher, never a failed run."""
    if os.environ.get('GITHUB_EVENT_NAME') == 'workflow_run':
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text(encoding='utf-8'))
        run = event.get('workflow_run', {})
        if (event.get('repository', {}).get('full_name') != os.environ['GITHUB_REPOSITORY']
                or run.get('name') != 'Daily Blog Autopilot' or run.get('head_branch') != 'master'):
            raise RuntimeError('Unexpected publisher workflow or repository; no video generation allowed.')
    else:
        runs = storage.api('GET', '/actions/workflows/daily-blog-autopilot.yml/runs',
                           params={'branch': 'master', 'per_page': 1})['workflow_runs']
        run = runs[0] if runs else {}
    if run.get('status') != 'completed' or run.get('conclusion') != 'success':
        raise RuntimeError('The daily blog publisher has not completed successfully; no video generation allowed.')
    return run['id']


def production_deployment(storage, sha, attempts=25):
    """Verify the exact checked-out commit was deployed by Vercel to Production.

    Read public deployment evidence rather than crawling a rate-limited website.
    Preview builds, commit checks alone, and failed/queued deployments do not qualify.
    """
    for attempt in range(attempts):
        deployments = storage.api('GET', '/deployments', params={
            'sha': sha, 'environment': 'Production', 'per_page': 10})
        for deployment in deployments:
            if (deployment.get('sha') != sha or deployment.get('environment') != 'Production'
                    or deployment.get('creator', {}).get('login') != 'vercel[bot]'):
                continue
            statuses = storage.api('GET', f'/deployments/{deployment["id"]}/statuses', params={'per_page': 1})
            if statuses and statuses[0].get('state') == 'success':
                return {'id': deployment['id'], 'sha': sha, 'environment': 'Production', 'state': 'success',
                        'verifiedAt': watcher.now(), 'url': statuses[0].get('environment_url')}
        if attempt + 1 < attempts:
            time.sleep(12)
    raise RuntimeError('The checked-out blog revision is not successfully deployed to Production yet. Retry this job later.')


def deployed_sources(proof, state, articles=None):
    if (proof.get('state') != 'success' or proof.get('environment') != 'Production'
            or not re.fullmatch(r'[0-9a-f]{40}', proof.get('sha', ''))):
        raise ValueError('Only a verified Production deployment may supply blog questions.')
    if articles is None:
        articles = json.loads(subprocess.check_output(
            ['node', str(ROOT / 'scripts/export-blog-video-sources.mjs')], cwd=ROOT, text=True, encoding='utf-8'))
    listed, packages = [], {}
    baseline_day = state.get('initializedAt', '')[:10]
    for article in articles:
        slug, title, body = article['slug'], article['title'], article['body']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or not isinstance(body, str):
            raise ValueError('Invalid registered blog source.')
        if slug not in state.get('articles', {}) and baseline_day and article.get('date', '') < baseline_day:
            continue  # A broader registry must not introduce old backfill.
        url = f'{watcher.BLOG}/{slug}'
        listed.append({'slug': slug, 'url': url, 'listedTitle': title})
        packages[slug] = {'slug': slug, 'title': title, 'url': url, 'verifiedLive': False,
                          'verification': 'production-deployment', 'productionDeployment': proof,
                          'fetchedAt': proof['verifiedAt'], 'contentHash': hashlib.sha256(body.encode()).hexdigest(),
                          'questions': watcher.renderer.extract_questions(body, include_answers=True)}
        packages[slug]['invalidQuestionTable'] = (not packages[slug]['questions'] and
            bool(re.search(r'^\|\s*\d+\s*\|.*A\).*B\).*C\).*D\)', body, re.M)))
    if not listed:
        raise ValueError('The deployed registry contains no eligible article sources.')
    return {'articles': listed, 'packages': packages}


def main():
    repository, token = os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN']
    storage = GitHubState(repository, token)
    state = storage.load()
    publisher_run = successful_blog_run(storage)
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    proof = production_deployment(storage, sha)
    proof['publisherRunId'] = publisher_run
    snapshot = deployed_sources(proof, state)
    directory = ROOT / '.social-automation/blog-videos'
    directory.mkdir(parents=True, exist_ok=True)
    state_file = directory / 'state.json'
    watcher.save_json(state_file, state)
    storage.save(state)
    args = type('Options', (), {'state_dir': str(directory), 'count': social.POLICY['questionLimit'],
                               'max_duration': social.POLICY['maxDurationSeconds'], 'max_videos': 3,
                               'voice_engine': 'kokoro',
                               'kokoro_model': str(ROOT / '.social-automation/voices/kokoro/kokoro-v1.0.fp16.onnx'),
                               'kokoro_voices': str(ROOT / '.social-automation/voices/kokoro/voices-v1.0.bin')})()
    try:
        watcher.run(args, source_snapshot=snapshot)
    finally:
        # Preserve discovery and retry records even when a source/render step fails.
        storage.save(json.loads(state_file.read_text(encoding='utf-8')))
    state = json.loads(state_file.read_text(encoding='utf-8'))
    run_url = f'https://github.com/{repository}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    for entry in state.get('articles', {}).values():
        if (entry.get('status') == 'ready' and entry.get('video')
                and entry.get('publishingStatus') not in ('scheduled', 'published')):
            campaign = social.reserve_campaign(state, entry)
            entry['publishingStatus'] = 'awaiting-metricool-scheduling' if campaign else 'archive-only'
            entry['metricoolBrandId'] = '7661098'
            entry.setdefault('artifactRunUrl', run_url)
            output = Path(entry['video']).parent
            if campaign:
                watcher.save_json(output / 'campaign.json', campaign)
    state['socialPolicy'] = social.POLICY
    watcher.save_json(state_file, state)
    storage.save(state)
    if any(entry.get('status') == 'retry' for entry in state.get('articles', {}).values()):
        raise RuntimeError('Some article videos remain retryable; their queue records have been preserved.')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        ready = [e for e in state.get('articles', {}).values() if e.get('status') == 'ready']
        lines = ['## MCQsBase blog quiz videos', '',
                 'Shorts run only after the blog publisher succeeds and Production deployment is verified.',
                 'Metricool: at most four campaigns / sixteen platform publications per month.',
                 'Publishing through the connected Metricool client remains a separate handoff.', '']
        lines.extend(f'- {e.get("sourceTitle", e["slug"])}: {e.get("publishingStatus", "ready")}' for e in ready)
        Path(summary).write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
