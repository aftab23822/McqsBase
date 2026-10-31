"""Render five sequential Shorts from one verified published article. No social writes."""
import argparse
from datetime import datetime, timedelta
import hashlib
import importlib.util
import json
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
quality = module('batch_quality', 'metricool-campaign-payload.py')


def same_day_slots(instant, count=5, spacing_minutes=30):
    """Schedule only after the complete batch is ready, all on the same local day."""
    current = instant.astimezone(ZoneInfo('Asia/Karachi'))
    first = (current + timedelta(minutes=15)).replace(second=0, microsecond=0)
    last_allowed = current.replace(hour=23, minute=55, second=0, microsecond=0)
    available = int((last_allowed - first).total_seconds() // 60)
    spacing = min(spacing_minutes, available // (count - 1)) if count > 1 else 0
    if first.date() != current.date() or (count > 1 and spacing < 5):
        raise ValueError('Too late to schedule all five videos today; hold the batch for a decision.')
    return [(first + timedelta(minutes=spacing * index)).isoformat() for index in range(count)]


def validate_part(manifest, package, part, start):
    quality.validate_video(manifest, package['slug'], package['title'], 3)
    if (manifest.get('sourceContentHash') != package['contentHash']
            or manifest.get('productionDeployment') != package['productionDeployment']):
        raise ValueError('A cached batch part belongs to a different deployed source revision.')
    sequence = manifest.get('sequence', {})
    expected = list(range(start, start + manifest['count']))
    if (manifest['count'] > 3 or sequence.get('part') != part or sequence.get('totalParts') != 5
            or sequence.get('sourceQuestionNumbers') != expected):
        raise ValueError('The batch has repeated, skipped or incorrectly numbered questions.')
    source = renderer.ordered_questions(package['questions'], start, manifest['count'])
    for actual, original in zip(manifest['questions'], source):
        if any(actual.get(key) != original.get(key) for key in ('question', 'choices', 'correctIndex', 'sourceNumber')):
            raise ValueError('A batch question or answer differs from its published source.')
    return expected[-1] + 1


def build_batch(package, output, render_part, decode, completed=None):
    """Recover complete parts, but release no scheduling manifest until all five pass."""
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    parts, start = [], 1
    for part in range(1, 6):
        folder = output / f'part-{part:02d}'
        manifest_path = folder / 'manifest.json'
        video = folder / 'mcqsbase-quiz.mp4'
        if not manifest_path.exists() or not video.exists():
            render_part(part, start, folder)
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        start = validate_part(manifest, package, part, start)
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

    def render_part(part, start, folder):
        subprocess.run([sys.executable, str(ROOT / 'scripts/create-quiz-video.py'),
                        '--article-json', args.article_json, '--selection', 'ordered',
                        '--start-question', str(start), '--count', '3', '--batch-part', str(part),
                        '--batch-size', '5', '--seconds', '3', '--max-duration', '89',
                        '--output', str(folder)], check=True)

    batch = build_batch(package, args.output, render_part, decode_video)
    print(json.dumps({'status': batch['status'], 'videos': 5, 'publications': 20,
                      'questions': [part['sourceQuestionNumbers'] for part in batch['parts']]}))
