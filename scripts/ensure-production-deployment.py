"""Make sure Vercel actually deploys the commit the daily blog just merged.

Vercel occasionally never receives a GitHub push (no deployment, no status at all).
This waits for a successful Production deployment that contains the commit and,
if none has even started, triggers the project's Deploy Hook once and waits again.
It never fails the publishing run: problems are reported as workflow warnings so
the downstream quiz workflow (which keeps its own retries) still starts.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

API = 'https://api.github.com/repos/'
ACTIVE = ('queued', 'pending', 'in_progress')


def warn(message):
    print('::warning::' + message, flush=True)


class GitHub:
    def __init__(self, repository, token):
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
            raise ValueError('Invalid GitHub repository.')
        self.base, self.token = API + repository, token

    def get(self, path):
        request = urllib.request.Request(self.base + path, headers={
            'Authorization': f'Bearer {self.token}', 'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'mcqsbase-deploy-check'})
        for attempt in range(4):
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    return json.load(response)
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                    raise
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                if attempt == 3:
                    raise
            time.sleep(5 * 2 ** attempt)


def vercel_production(deployment):
    return (deployment.get('environment') == 'Production'
            and deployment.get('creator', {}).get('login') == 'vercel[bot]')


def latest_state(github, deployment):
    statuses = github.get(f'/deployments/{deployment["id"]}/statuses?per_page=1')
    return statuses[0].get('state') if statuses else 'pending'


def check(github, sha):
    """Return ('live', sha) / ('building', None) / ('missing', None)."""
    building = False
    for deployment in github.get(f'/deployments?sha={sha}&environment=Production&per_page=10'):
        if deployment.get('sha') != sha or not vercel_production(deployment):
            continue
        state = latest_state(github, deployment)
        if state == 'success':
            return 'live', sha
        building = building or state in ACTIVE
    # A later Production deployment that contains this commit also ships it.
    for deployment in github.get('/deployments?environment=Production&per_page=10'):
        if not vercel_production(deployment) or deployment.get('sha') == sha:
            continue
        state = latest_state(github, deployment)
        if state in ACTIVE:
            building = True
            continue
        if state != 'success':
            continue
        comparison = github.get(f'/compare/{sha}...{deployment["sha"]}')
        if comparison.get('status') in ('ahead', 'identical'):
            return 'live', deployment['sha']
        break  # Only the newest successful deployment is what is live.
    return ('building' if building else 'missing'), None


def wait(github, sha, seconds, interval, give_up_if_missing_after=None):
    deadline = start = time.monotonic()
    deadline += seconds
    while True:
        status, live = check(github, sha)
        print(f'Production deployment for {sha[:7]}: {status}', flush=True)
        if status == 'live':
            return status, live
        now = time.monotonic()
        if now >= deadline:
            return status, None
        if status == 'missing' and give_up_if_missing_after and now - start >= give_up_if_missing_after:
            return status, None
        time.sleep(interval)


def trigger(hook):
    if not hook.startswith('https://api.vercel.com/'):
        raise ValueError('VERCEL_DEPLOY_HOOK_URL must be a Vercel Deploy Hook URL.')
    request = urllib.request.Request(hook, method='POST', headers={'User-Agent': 'mcqsbase-deploy-check'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                print(f'Deploy Hook accepted (HTTP {response.status}).', flush=True)
                return
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == 2:
                raise
            time.sleep(10)


def main(sleep_scale=1.0):
    sha = os.environ.get('DEPLOY_SHA', '')
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        print('No merged commit to verify; nothing to do.')
        return 0
    github = GitHub(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN'])
    # Vercel normally registers a push within a minute or two and builds in ~2 minutes.
    status, live = wait(github, sha, 15 * 60 * sleep_scale, 30 * sleep_scale,
                        give_up_if_missing_after=6 * 60 * sleep_scale)
    if status == 'live':
        print(f'Commit {sha[:7]} is live on Production (via {live[:7]}).')
        return 0
    if status == 'building':
        warn(f'Vercel is still building commit {sha[:7]} after 15 minutes; check the Vercel dashboard.')
        return 0
    hook = os.environ.get('VERCEL_DEPLOY_HOOK_URL', '').strip()
    if not hook:
        warn(f'Vercel never started a Production deployment for {sha[:7]} and no VERCEL_DEPLOY_HOOK_URL '
             'secret is set. Redeploy master in Vercel so today\'s article goes live.')
        return 0
    warn(f'Vercel did not pick up commit {sha[:7]}; triggering the Deploy Hook as a fallback.')
    trigger(hook)
    status, live = wait(github, sha, 12 * 60 * sleep_scale, 30 * sleep_scale)
    if status == 'live':
        print(f'Commit {sha[:7]} is live on Production after the Deploy Hook (via {live[:7]}).')
    else:
        warn(f'Commit {sha[:7]} is still not live after the Deploy Hook ({status}); check the Vercel dashboard.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:  # Never block publishing on the safety net itself.
        warn(f'Deployment check could not complete: {error}')
        sys.exit(0)
