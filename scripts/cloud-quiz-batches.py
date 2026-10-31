"""Event-driven five-video batches, with one ledger per article on the existing state branch."""
import argparse
import base64
from datetime import datetime, timedelta, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


batcher = module('five_batcher', 'create-quiz-batch.py')
cloud = module('five_cloud', 'cloud-blog-videos.py')
media = module('five_media', 'quiz-cloud-media.py')
publisher = module('five_publisher', 'studio-cloud.py')
POLICY = json.loads((ROOT / 'config/quiz-batch-policy.json').read_text(encoding='utf-8'))


class Ledger:
    def __init__(self, storage, slug):
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError('Invalid batch article slug.')
        self.storage, self.path, self.sha = storage, 'batches/' + slug + '.json', None

    def load(self):
        response = self.storage.http.get(self.storage.base + '/contents/' + self.path,
            params={'ref': cloud.STATE_BRANCH}, timeout=60)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        record = response.json()
        self.sha = record['sha']
        return json.loads(base64.b64decode(record['content']))

    def save(self, record):
        payload = {'branch': cloud.STATE_BRANCH, 'message': 'Update five-video batch receipts [skip ci]',
            'content': base64.b64encode(json.dumps(record, ensure_ascii=False, indent=2).encode()).decode()}
        if self.sha:
            payload['sha'] = self.sha
        result = self.storage.api('PUT', '/contents/' + self.path, json=payload)
        self.sha = result['content']['sha']


def summary(state, record, ledger):
    # Keep the historical state small: full packages/receipts live in per-article files.
    state.setdefault('videoBatches', {})[record['slug']] = {
        'status': record['status'], 'ledger': ledger.path, 'createdAt': record['createdAt'],
        'sourceUrl': record['package']['url'],
        'scheduledAt': record.get('schedule', []),
        'published': sum(receipt.get('status') == 'PUBLISHED' for part in record.get('parts', [])
                         for receipt in part.get('receipts', {}).values())}


def choose(state, articles):
    # Resume an existing incomplete batch before creating a second batch for that article.
    for slug, entry in state.get('videoBatches', {}).items():
        if entry['status'] in ('rendering', 'retry'):
            return slug
    newest = articles[0]
    slug = newest['slug']
    if slug in state.get('videoBatches', {}):
        return None
    if newest.get('date', '') < POLICY['firstDate']:
        return None
    if slug in state.get('articles', {}) and slug != POLICY['firstArticle']:
        return None  # Historical baseline and old campaigns are never backfilled.
    return slug


def public_bytes(url):
    if urllib.parse.urlparse(url).scheme != 'https':
        raise ValueError('Public media must use HTTPS.')
    # Separate unauthenticated request: never forward either cloud credential to media hosts.
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'MCQsBase-Cloud-Publisher/1.0'}), timeout=180) as response:
        return response.read(100_000_001)


def generate(storage, state, slug, publisher_run):
    ledger = Ledger(storage, slug)
    record = ledger.load()
    if record is None:
        sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
        proof = cloud.production_deployment(storage, sha)
        proof['publisherRunId'] = publisher_run
        snapshot = cloud.deployed_sources(proof, state)
        package = snapshot['packages'][slug]
        record = {'version': 1, 'slug': slug, 'createdAt': datetime.now(timezone.utc).isoformat(),
            'status': 'rendering', 'package': package, 'parts': [], 'thinkingSeconds': 3}
        ledger.save(record)
    package = record['package']
    def save():
        ledger.save(record)
        summary(state, record, ledger)
        storage.save(state)
    save()
    if len(package['questions']) < 5:
        record.update(status='skipped', reason=f'Only {len(package["questions"])} valid published MCQs; five sequential videos cannot be made.')
        save()
        return
    output = ROOT / '.social-automation/five-video-batch' / slug
    output.mkdir(parents=True, exist_ok=True)
    source = output / 'article.json'
    source.write_text(json.dumps(package, ensure_ascii=False), encoding='utf-8')
    for part in record['parts']:
        folder = output / f'part-{part["part"]:02d}'
        folder.mkdir(parents=True, exist_ok=True)
        video = folder / 'mcqsbase-quiz.mp4'
        if not video.exists():
            data = public_bytes(part['asset']['videoUrl'])
            if hashlib.sha256(data).hexdigest() != part['sha256']:
                raise ValueError('Cached public MP4 failed its saved hash.')
            video.write_bytes(data)
        (folder / 'manifest.json').write_text(json.dumps(part['manifest']), encoding='utf-8')
        (folder / 'platform-captions.json').write_text(json.dumps(part['captions']), encoding='utf-8')

    def render(part, start, folder):
        subprocess.run([os.sys.executable, str(ROOT / 'scripts/create-quiz-video.py'), '--article-json', str(source),
            '--selection', 'ordered', '--start-question', str(start), '--count', '3', '--batch-part', str(part),
            '--batch-size', '5', '--seconds', '3', '--max-duration', '89', '--output', str(folder)], check=True)

    def complete(number, folder, manifest, part):
        prior = next((item for item in record['parts'] if item['part'] == number), None)
        if prior:
            if prior['sha256'] != part['sha256']:
                raise ValueError('A completed batch video changed; hold rather than replace media.')
            return
        asset = media.upload_video(storage, os.environ['GITHUB_REPOSITORY'], slug + f'-part-{number:02d}', folder / 'mcqsbase-quiz.mp4')
        record['parts'].append({**part, 'manifest': manifest, 'asset': asset,
            'captions': json.loads((folder / 'platform-captions.json').read_text(encoding='utf-8'))})
        save()
    result = batcher.build_batch(package, output, render, batcher.decode_video, completed=complete)
    record['status'] = 'ready'
    record['batch'] = result
    save()
    print(json.dumps({'slug': slug, 'status': 'ready', 'videos': len(record['parts']),
                      'questions': [part['sourceQuestionNumbers'] for part in record['parts']]}))


def publish(storage, state, channels, studio, spacing, verify_only=False):
    for slug, info in list(state.get('videoBatches', {}).items()):
        if info['status'] not in ('ready', 'scheduling', 'scheduled'):
            continue
        if verify_only and info['status'] != 'scheduled':
            continue
        ledger = Ledger(storage, slug)
        record = ledger.load()
        if record is None:
            raise RuntimeError('A reserved batch ledger is missing; never reset it.')
        def save(updated):
            ledger.save(updated)
            summary(state, updated, ledger)
            storage.save(state)
        if record['status'] == 'scheduled':
            # Read existing receipts on the next publication event, with no cron polling.
            start = (datetime.fromisoformat(record['schedule'][0]) - timedelta(days=1)).isoformat()
            end = (datetime.fromisoformat(record['schedule'][-1]) + timedelta(days=1)).isoformat()
            posts = studio.posts(start, end)
            for part in record['parts']:
                publisher.reconcile(part, posts, channels)
            all_receipts = [r for p in record['parts'] for r in p['receipts'].values()]
            if any(r['status'] == 'ERROR' for r in all_receipts):
                save(record)
                raise RuntimeError('A scheduled provider publication failed; preserve the post IDs for repair.')
            if len(all_receipts) == 20 and all(r['status'] == 'PUBLISHED' for r in all_receipts):
                record['status'] = 'published'
            save(record)
            print(json.dumps({'slug': slug, 'status': record['status'], 'published': sum(r['status'] == 'PUBLISHED' for r in all_receipts)}))
            continue
        if len(record['parts']) != 5:
            raise ValueError('Do not import or schedule an incomplete batch.')
        next_question = 1
        for number, part in enumerate(record['parts'], 1):
            next_question = batcher.validate_part(part['manifest'], record['package'], number, next_question)
            if part['sha256'] != part['asset']['videoSha256']:
                raise ValueError('The saved asset hash differs from its validated batch part.')
        for part in record['parts']:
            if part.get('studioMedia'):
                continue
            # Reconcile an interrupted upload by its immutable file name before importing again.
            filename = part['asset']['videoUrl'].rsplit('/', 1)[-1]
            matches = studio.call('GET', '/media?' + urllib.parse.urlencode({'search': filename}))
            matches = [item for item in matches['results']
                       if item.get('name') == filename or item.get('originalName') == filename]
            if len(matches) > 1:
                raise RuntimeError('Ambiguous duplicate media import; hold the batch.')
            if matches:
                imported = matches[0]
            else:
                if part.get('uploadIntent', {}).get('status') == 'uncertain':
                    raise RuntimeError('The earlier media import is uncertain and absent from the library; hold rather than duplicate it.')
                part['uploadIntent'] = {'filename': filename, 'status': 'uncertain'}
                save(record)
                imported = studio.call('POST', '/upload-from-url', {'url': part['asset']['videoUrl']})
            if not imported.get('id') or not imported.get('path'):
                raise RuntimeError('Studio did not return a verifiable media ID and path.')
            if hashlib.sha256(public_bytes(imported['path'])).hexdigest() != part['sha256']:
                raise ValueError('Studio imported different video bytes; hold before publishing.')
            part['studioMedia'] = {key: imported[key] for key in ('id', 'path')}
            part['uploadIntent'] = {'filename': filename, 'status': 'verified'}
            save(record)
        slots = record.get('schedule') or batcher.same_day_slots(datetime.now(timezone.utc), spacing_minutes=spacing)
        publisher.schedule_batch(studio, record, channels, save, slots)
        print(json.dumps({'slug': slug, 'status': record['status'], 'platformPosts': 20, 'times': record['schedule']}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase', choices=('plan', 'render', 'publish'), required=True)
    parser.add_argument('--spacing', type=int, choices=(5, 30), default=30)
    parser.add_argument('--validation', action='store_true', help='Allow the expressly approved first-article rollout check.')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    if not POLICY['enabled'] and not args.validation:
        print('Five-video cutover is not active yet.')
        if os.environ.get('GITHUB_OUTPUT'):
            Path(os.environ['GITHUB_OUTPUT']).write_text('generate=false\nwork=false\n', encoding='utf-8')
        return
    storage = cloud.GitHubState(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN'])
    state = storage.load()
    if not storage.sha:
        raise RuntimeError('The established baseline must already exist; do not initialize another queue.')
    publisher_run = None if args.verify_only else cloud.successful_blog_run(storage)
    articles = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/export-blog-video-sources.mjs')], cwd=ROOT, text=True, encoding='utf-8'))
    slug = choose(state, articles)
    if args.validation and slug and slug != POLICY['firstArticle']:
        raise ValueError('Rollout validation is restricted to the one approved latest article.')
    if args.phase == 'plan':
        generate_new = slug is not None and state.get('videoBatches', {}).get(slug, {}).get('status') not in ('ready', 'scheduling')
        work = generate_new or any(item['status'] in ('ready', 'scheduling', 'scheduled') for item in state.get('videoBatches', {}).values())
        with Path(os.environ['GITHUB_OUTPUT']).open('a', encoding='utf-8') as stream:
            stream.write(f'generate={str(generate_new).lower()}\nwork={str(work).lower()}\n')
        print(json.dumps({'generate': generate_new, 'work': work, 'slug': slug}))
    elif args.phase == 'render':
        while slug:
            generate(storage, state, slug, publisher_run)
            slug = choose(state, articles)
    else:
        studio = publisher.Studio()
        channels = publisher.connected(studio, POLICY)
        publish(storage, state, channels, studio, args.spacing, args.verify_only)


if __name__ == '__main__':
    main()
