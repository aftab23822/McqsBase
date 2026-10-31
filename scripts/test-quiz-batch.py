import copy
from datetime import datetime
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('batch', Path(__file__).with_name('create-quiz-batch.py'))
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)


def source():
    return {'slug': 'example-quiz', 'title': '100 Example MCQs',
            'url': 'https://www.mcqsbase.com/blog/example-quiz', 'contentHash': 'a' * 64,
            'productionDeployment': {'id': 1, 'sha': 'b' * 40, 'environment': 'Production',
                                     'state': 'success', 'publisherRunId': 123},
            'questions': [{'sourceNumber': n, 'question': f'Published question {n}?',
                           'choices': ['One', 'Two', 'Three', 'Four'], 'correctIndex': 1}
                          for n in range(1, 101)]}


def manifest(package, part, start, count=3):
    stages, elapsed = [], 0
    for n in range(1, count + 1):
        for kind, duration in [('narration', 12), ('countdown', 1), ('countdown', 1),
                               ('countdown', 1), ('reveal', 4)]:
            stages.append({'stage': kind, 'question': n, 'start': elapsed, 'duration': duration})
            elapsed += duration
    return {'sourceUrl': package['url'], 'sourceTitle': package['title'], 'title': package['title'],
            'sourceVerification': 'production-deployment', 'productionDeployment': package['productionDeployment'],
            'sourceContentHash': package['contentHash'], 'count': count, 'width': 1080, 'height': 1920,
            'introIncluded': False, 'narration': True, 'answersIncluded': True,
            'voiceName': 'Kokoro af_heart', 'secondsPerQuestion': 3, 'countdownStartsAfterNarration': True,
            'durationSeconds': elapsed, 'stages': stages,
            'questions': copy.deepcopy(package['questions'][start - 1:start - 1 + count]),
            'sequence': {'part': part, 'totalParts': 5, 'sourceQuestionNumbers': list(range(start, start + count))}}


class BatchTests(unittest.TestCase):
    def test_ordered_selection_does_not_skip_long_or_missing_questions(self):
        questions = source()['questions']
        questions[0]['question'] = 'Long ' * 60
        self.assertEqual(batch.renderer.ordered_questions(questions, 1, 3), questions[:3])
        with self.assertRaisesRegex(ValueError, 'missing'):
            batch.renderer.ordered_questions(questions[1:], 1, 3)

    def test_all_five_parts_required_before_ready_and_shorter_parts_resume_actual_next_question(self):
        package, starts = source(), []
        def render(part, start, folder):
            starts.append(start)
            folder.mkdir(parents=True)
            record = manifest(package, part, start, count=2 if part == 1 else 3)
            (folder / 'manifest.json').write_text(json.dumps(record))
            (folder / 'mcqsbase-quiz.mp4').write_bytes(f'fake-{part}'.encode())
            self.assertFalse((folder.parent / 'batch.json').exists())
        with tempfile.TemporaryDirectory() as tmp:
            record = batch.build_batch(package, tmp, render, lambda *_: None)
            self.assertEqual(starts, [1, 3, 6, 9, 12])
            self.assertEqual(record['platformPublicationCount'], 20)
            self.assertEqual([n for p in record['parts'] for n in p['sourceQuestionNumbers']], list(range(1, 15)))
            # A repeat of the same batch reuses complete files; it never rerenders.
            again = batch.build_batch(package, tmp, lambda *_: self.fail('rerendered'), lambda *_: None)
            self.assertEqual(record, again)

    def test_failed_part_never_releases_a_partial_batch(self):
        with tempfile.TemporaryDirectory() as tmp:
            def render(*_):
                raise RuntimeError('render failed')
            with self.assertRaisesRegex(RuntimeError, 'render failed'):
                batch.build_batch(source(), tmp, render, lambda *_: None)
            self.assertFalse((Path(tmp) / 'batch.json').exists())

    def test_changed_source_and_fabricated_answer_are_rejected(self):
        package = source()
        record = manifest(package, 1, 1)
        record['sourceContentHash'] = 'c' * 64
        with self.assertRaisesRegex(ValueError, 'revision'):
            batch.validate_part(record, package, 1, 1)
        record = manifest(package, 1, 1)
        record['questions'][0]['correctIndex'] = 0
        with self.assertRaisesRegex(ValueError, 'differs'):
            batch.validate_part(record, package, 1, 1)

    def test_early_reveal_is_still_rejected(self):
        record = manifest(source(), 1, 1)
        record['stages'][1]['stage'] = 'reveal'
        with self.assertRaisesRegex(ValueError, 'countdown'):
            batch.validate_part(record, source(), 1, 1)

    def test_all_publication_times_are_future_and_same_pakistan_day(self):
        for hour in (9, 17, 22):
            now = datetime(2026, 10, 31, hour, 0, tzinfo=ZoneInfo('Asia/Karachi'))
            slots = [datetime.fromisoformat(s) for s in batch.same_day_slots(now)]
            self.assertEqual(len(slots), 5)
            self.assertTrue(all(s > now and s.date() == now.date() for s in slots))
            self.assertEqual(sorted(set(slots)), slots)
        with self.assertRaisesRegex(ValueError, 'Too late'):
            batch.same_day_slots(datetime(2026, 10, 31, 23, 45, tzinfo=ZoneInfo('Asia/Karachi')))

    def test_actual_decoded_timeline_must_match_the_manifest(self):
        with patch.object(batch.renderer, 'find_ffmpeg', return_value='ffmpeg'), patch.object(batch.subprocess, 'run') as run:
            run.return_value = SimpleNamespace(stdout='out_time_us=75958333\nprogress=end\n')
            with self.assertRaisesRegex(ValueError, 'decoded Short'):
                batch.decode_video('sample.mp4', 80)
            run.return_value = SimpleNamespace(stdout='out_time_us=80000000\nprogress=end\n')
            batch.decode_video('sample.mp4', 80)


if __name__ == '__main__':
    unittest.main()
