"""Cheap, read-only campaign gate. Uses the standard library; no voices or video dependencies."""
import base64
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('quiz_video', ROOT / 'scripts/create-quiz-video.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
social = renderer.social


def plan_campaign(state, articles=None, instant=None):
    slot = social.publication_window(instant)
    if not slot:
        return {'generate': False, 'reason': 'No campaign publication window before month-end.'}
    campaigns = state.get('campaigns', {}).get(slot['month'], {})
    existing = campaigns.get(str(slot['window']))
    if existing:
        entry = state.get('articles', {}).get(existing['slug'], {})
        if entry.get('status') in ('pending', 'rendering', 'retry'):
            return {'generate': True, 'slug': existing['slug'], 'reason': 'Retry the reserved campaign render.'}
        return {'generate': False, 'reason': 'This campaign window is already filled; no video will be created.'}
    if (len(campaigns) >= social.POLICY['monthlyCampaignLimit'] or
            (len(campaigns) + 1) * len(social.POLICY['networks']) > social.POLICY['monthlyPublicationBudget']):
        return {'generate': False, 'reason': 'Monthly campaign budget is already reserved.'}
    if articles is None:
        # This is only planning. Production deployment is verified again before
        # any article is rendered or considered publishable.
        articles = json.loads(subprocess.check_output(
            ['node', str(ROOT / 'scripts/export-blog-video-sources.mjs')], cwd=ROOT, text=True, encoding='utf-8'))
    baseline_day = state.get('initializedAt', '')[:10]
    for article in articles:
        entry = state.get('articles', {}).get(article['slug'], {})
        if entry and entry.get('status') not in ('pending', 'rendering', 'retry'):
            continue
        if not entry and baseline_day and article.get('date', '') < baseline_day:
            continue
        if renderer.extract_questions(article['body'], include_answers=True):
            return {'generate': True, 'slug': article['slug'], 'reason': 'Select the newest eligible article for this window.'}
    return {'generate': False, 'reason': 'No new eligible article for a campaign; no video will be created.'}


def load_state(repository, token):
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('Invalid repository.')
    def read(path):
        request = Request('https://api.github.com/repos/' + repository + path,
                          headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json'})
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    try:
        record = read('/contents/state.json?ref=codex%2Fblog-video-state')
        return json.loads(base64.b64decode(record['content']))
    except HTTPError as error:
        if error.code != 404:
            raise
        try:
            read('/git/ref/heads/codex/blog-video-state')
        except HTTPError as branch_error:
            if branch_error.code == 404:
                return json.loads((ROOT / 'config/blog-video-state-seed.json').read_text(encoding='utf-8'))
            raise
        raise RuntimeError('Existing state branch is missing its queue; never reset its baseline.')


if __name__ == '__main__':
    result = plan_campaign(load_state(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN']))
    print(json.dumps(result))
    with Path(os.environ['GITHUB_OUTPUT']).open('a', encoding='utf-8') as output:
        output.write('generate=' + str(result['generate']).lower() + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        Path(os.environ['GITHUB_STEP_SUMMARY']).write_text(
            '## Campaign render decision\n\n' + result['reason'] + '\n', encoding='utf-8')
