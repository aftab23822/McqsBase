"""Render five non-repeating Shorts from one verified published article. No social writes."""
import argparse
from datetime import datetime, timedelta
import hashlib
import importlib.util
import json
import random
import secrets
from pathlib import Path
import subprocess
import sys
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


renderer = module('batch_renderer', 'create-quiz-video.py')
quality = module('batch_quality', 'quiz-video-quality.py')
POLICY = renderer.social.POLICY


def same_day_slots(instant, count=5, spacing_minutes=None):
    """Schedule only after the complete batch is ready, all on the same local day."""
    current = instant.astimezone(ZoneInfo('Asia/Karachi'))
    first = (current + timedelta(minutes=15)).replace(second=0, microsecond=0)
    if first < current + timedelta(minutes=15):
        first += timedelta(minutes=1)
    if spacing_minutes is None:
        first = max(first, current.replace(hour=POLICY['dayStartHour'], minute=0, second=0, microsecond=0))
    last_allowed = current.replace(hour=23, minute=55, second=0, microsecond=0)
    preferred_end = current.replace(hour=POLICY['dayEndHour'], minute=0, second=0, microsecond=0)
    if spacing_minutes is None and (preferred_end - first).total_seconds() >= 300 * (count - 1):
        last_allowed = preferred_end
    available = int((last_allowed - first).total_seconds() // 60)
    spacing = min(spacing_minutes or available, available // (count - 1)) if count > 1 else 0
    if first.date() != current.date() or (count > 1 and spacing < 5):
        raise ValueError('Too late to schedule all five videos today; hold the batch for a decision.')
    return [(first + timedelta(minutes=spacing * index)).isoformat() for index in range(count)]


def selection_plan(questions, seed=None):
    """Shuffle source-number bands to cover the whole test without replacement."""
    numbers = sorted(q['sourceNumber'] for q in questions)
    texts = [' '.join(q['question'].casefold().split()) for q in questions]
    if (any(type(n) is not int or n < 1 for n in numbers) or len(set(numbers)) != len(numbers)
            or len(set(texts)) != len(texts)):
        raise ValueError('Source questions must have unique positive numbers and non-repeated text.')
    seed = seed or secrets.token_hex(32)
    rng = random.Random(seed)
    # Bands reflect position in the source; no unsupported topic labels are inferred.
    bands = [numbers[len(numbers) * n // 5:len(numbers) * (n + 1) // 5] for n in range(5)]
    for band in bands:
        rng.shuffle(band)
    order = []
    while any(bands):
        active = [band for band in bands if band]
        rng.shuffle(active)
        order.extend(band.pop() for band in active)
    return {'version': 1, 'strategy': 'stratified-source-position', 'seed': seed,
            'sourceQuestionNumbers': order}


def render_selection(package, start, part):
    """Leave at least one unused question for every remaining video."""
    count = min(3, len(package['questions']) - start + 1 - (5 - part))
    if count < 1:
        raise ValueError('Not enough distinct source questions remain for five videos.')
    return ['--selection', 'planned' if package.get('selectionPlan') else 'ordered',
            '--start-question', str(start), '--count', str(count)]


def validate_part(manifest, package, part, start):
    quality.validate_video(manifest, package['slug'], package['title'], 3)
    if (manifest.get('sourceContentHash') != package['contentHash']
            or manifest.get('productionDeployment') != package['productionDeployment']):
        raise ValueError('A cached batch part belongs to a different deployed source revision.')
    sequence = manifest.get('sequence', {})
    planned = package.get('selectionPlan')
    source = (renderer.planned_questions(package['questions'], planned['sourceQuestionNumbers'], start, manifest['count'])
              if planned else renderer.ordered_questions(package['questions'], start, manifest['count']))
    expected = [q['sourceNumber'] for q in source]
    if (manifest['count'] > 3 or sequence.get('part') != part or sequence.get('totalParts') != 5
            or sequence.get('sourceQuestionNumbers') != expected):
        raise ValueError('The batch has repeated, skipped or incorrectly numbered questions.')
    if planned and manifest.get('branding') != package.get('videoBranding'):
        raise ValueError('The video does not contain the approved eagle branding.')
    for actual, original in zip(manifest['questions'], source):
        if any(actual.get(key) != original.get(key) for key in ('question', 'choices', 'correctIndex', 'sourceNumber')):
            raise ValueError('A batch question or answer differs from its published source.')
    return start + manifest['count']


def build_batch(package, output, render_part, decode, completed=None):
    """Recover complete parts, but release no scheduling manifest until all five pass."""
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    parts, start, seen_numbers, seen_texts = [], 1, set(), set()
    for part in range(1, 6):
        folder = output / f'part-{part:02d}'
        manifest_path = folder / 'manifest.json'
        video = folder / 'mcqsbase-quiz.mp4'
        if not manifest_path.exists() or not video.exists():
            render_part(part, start, folder)
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        start = validate_part(manifest, package, part, start)
        for question in manifest['questions']:
            number, text = question['sourceNumber'], ' '.join(question['question'].casefold().split())
            if number in seen_numbers or text in seen_texts:
                raise ValueError('A question is repeated across the five videos.')
            seen_numbers.add(number)
            seen_texts.add(text)
        decode(video, manifest['durationSeconds'])
        parts.append({'part': part, 'directory': folder.name, 'sourceQuestionNumbers': manifest['sequence']['sourceQuestionNumbers'],
                      'count': manifest['count'], 'durationSeconds': manifest['durationSeconds'],
                      'sha256': hashlib.sha256(video.read_bytes()).hexdigest()})
        if completed:
            completed(part, folder, manifest, parts[-1])
    batch = {'version': 1, 'status': 'ready-for-scheduling', 'slug': package['slug'],
             'sourceUrl': package['url'], 'sourceTitle': package['title'],
             'sourceContentHash': package['contentHash'], 'productionDeployment': package['productionDeployment'],
             'videoCount': 5, 'platformPublicationCount': 20, 'parts': parts}
    pending = output / 'batch.tmp'
    pending.write_text(json.dumps(batch, indent=2, ensure_ascii=False), encoding='utf-8')
    pending.replace(output / 'batch.json')
    return batch


def decode_video(video, duration):
    # Decode the complete file, rather than trusting a successful encoder exit.
    command = [renderer.find_ffmpeg(), '-v', 'error', '-xerror', '-i', str(video),
               '-progress', 'pipe:1', '-nostats', '-f', 'null', '-']
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    times = [int(line.split('=', 1)[1]) / 1_000_000 for line in result.stdout.splitlines()
             if line.startswith('out_time_us=') and line.split('=', 1)[1].lstrip('-').isdigit()]
    if not times or not 0 < duration <= 89 or abs(times[-1] - duration) > .25:
        raise ValueError('A decoded Short has an invalid expected duration.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--article-json', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    package, questions = renderer.load_article_package(args.article_json)
    package['questions'] = questions
    output = Path(args.output)
    saved = output / 'article.json'
    if saved.exists():
        prior = json.loads(saved.read_text(encoding='utf-8'))
        if prior['contentHash'] != package['contentHash']:
            raise ValueError('A different source revision already owns this batch folder.')
        package = prior
    else:
        package['selectionPlan'] = selection_plan(questions)
        package['videoBranding'] = renderer.branding()
        output.mkdir(parents=True, exist_ok=True)
        saved.write_text(json.dumps(package, ensure_ascii=False), encoding='utf-8')

    def render_part(part, start, folder):
        subprocess.run([sys.executable, str(ROOT / 'scripts/create-quiz-video.py'),
                        '--article-json', str(saved), *render_selection(package, start, part), '--batch-part', str(part),
                        '--batch-size', '5', '--seconds', '3', '--max-duration', '89',
                        '--output', str(folder)], check=True)

    batch = build_batch(package, args.output, render_part, decode_video)
    print(json.dumps({'status': batch['status'], 'videos': 5, 'publications': 20,
                      'questions': [part['sourceQuestionNumbers'] for part in batch['parts']]}))
