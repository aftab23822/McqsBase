"""Render and decode one local-only random-part sample; never upload or publish it."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('smoke_batch', ROOT / 'scripts/create-quiz-batch.py')
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)
slug = 'university-of-sindh-entry-test-mcqs'
body = (ROOT / 'public/blog' / slug / 'article.md').read_text(encoding='utf-8')
title, _ = batch.renderer.article_titles(slug)
questions = batch.renderer.extract_questions(body, include_answers=True)
package = {'slug': slug, 'title': title, 'url': 'https://www.mcqsbase.com/blog/' + slug,
           'contentHash': hashlib.sha256(body.encode()).hexdigest(), 'verification': 'local-preview',
           'questions': questions, 'selectionPlan': batch.selection_plan(questions, 'linux-branding-smoke'),
           'videoBranding': batch.renderer.branding()}
output = ROOT / '.social-automation/cloud-smoke'
output.mkdir(parents=True, exist_ok=True)
source = output / 'sample-article.json'
source.write_text(json.dumps(package, ensure_ascii=False), encoding='utf-8')
subprocess.run([sys.executable, str(ROOT / 'scripts/create-quiz-video.py'), '--article-json', str(source),
                *batch.render_selection(package, 1, 1), '--batch-part', '1', '--batch-size', '5',
                '--seconds', '3', '--max-duration', '89', '--output', str(output)], check=True)
manifest = json.loads((output / 'manifest.json').read_text(encoding='utf-8'))
batch.decode_video(output / 'mcqsbase-quiz.mp4', manifest['durationSeconds'])
if (manifest['sequence']['sourceQuestionNumbers'] != package['selectionPlan']['sourceQuestionNumbers'][:manifest['count']]
        or manifest['branding'] != package['videoBranding'] or manifest['introIncluded']
        or manifest['voiceName'] != 'Kokoro af_heart' or manifest['secondsPerQuestion'] != 3):
    raise ValueError('The real render did not follow the saved random order and approved branding/voice/timing.')
print(json.dumps({'sampleOnly': True, 'durationSeconds': manifest['durationSeconds'],
                  'sourceQuestionNumbers': manifest['sequence']['sourceQuestionNumbers'], 'logo': 'eagle'}))
