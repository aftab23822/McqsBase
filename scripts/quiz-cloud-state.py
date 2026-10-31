"""Durable existing GitHub state and exact Production source verification."""
import base64
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time
import requests
ROOT = Path(__file__).resolve().parents[1]
STATE_BRANCH = "codex/blog-video-state"
spec = importlib.util.spec_from_file_location("cloud_renderer", ROOT / "scripts/create-quiz-video.py")
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)


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
            raise RuntimeError('The canonical state queue is missing; restore it before publishing. Never reset the baseline.')
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
            raise RuntimeError('An existing canonical state revision is required; never create a replacement queue.')
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
                        'verifiedAt': datetime.now(timezone.utc).isoformat(), 'url': statuses[0].get('environment_url')}
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
        url = f'https://www.mcqsbase.com/blog/{slug}'
        listed.append({'slug': slug, 'url': url, 'listedTitle': title})
        packages[slug] = {'slug': slug, 'title': title, 'url': url, 'verifiedLive': False,
                          'verification': 'production-deployment', 'productionDeployment': proof,
                          'fetchedAt': proof['verifiedAt'], 'contentHash': hashlib.sha256(body.encode()).hexdigest(),
                          'questions': renderer.extract_questions(body, include_answers=True)}
        packages[slug]['invalidQuestionTable'] = (not packages[slug]['questions'] and
            bool(re.search(r'^\|\s*\d+\s*\|.*A\).*B\).*C\).*D\)', body, re.M)))
    if not listed:
        raise ValueError('The deployed registry contains no eligible article sources.')
    return {'articles': listed, 'packages': packages}
