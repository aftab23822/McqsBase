"""Publication selection and durable-state regressions for the new batch route."""
from copy import deepcopy
import importlib.util
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('cloud-quiz-batches.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class Worker(unittest.TestCase):
    def test_only_latest_article_is_selected(self):
        articles = [{'slug': 'newest', 'date': '2026-11-01'}, {'slug': 'older', 'date': '2026-10-31'}]
        self.assertEqual(worker.choose({'articles': {}}, articles), 'newest')
        self.assertIsNone(worker.choose({'articles': {}, 'videoBatches': {'newest': {'status': 'published'}}}, articles))

    def test_old_baseline_is_never_backfilled(self):
        self.assertIsNone(worker.choose({'articles': {'old-comsats': {'status': 'excluded'}}},
            [{'slug': 'old-comsats', 'date': '2026-10-31'}]))
        self.assertIsNone(worker.choose({'articles': {}}, [{'slug': 'old-untracked', 'date': '2026-10-25'}]))

    def test_named_latest_launch_exception_only(self):
        slug = worker.POLICY['firstArticle']
        self.assertEqual(worker.choose({'articles': {slug: {'status': 'not-selected'}}},
            [{'slug': slug, 'date': '2026-10-31'}]), slug)

    def test_existing_partial_render_resumes_before_another_article(self):
        state = {'articles': {}, 'videoBatches': {'reserved': {'status': 'rendering'}}}
        self.assertEqual(worker.choose(state, [{'slug': 'latest', 'date': '2026-11-02'}]), 'reserved')

    def test_ready_or_partial_publications_do_not_suppress_the_next_daily_article(self):
        for status in ('ready', 'scheduling'):
            state = {'articles': {}, 'videoBatches': {'reserved': {'status': status}}}
            self.assertEqual(worker.choose(state, [{'slug': 'latest', 'date': '2026-11-02'}]), 'latest')

    def test_scheduled_batch_is_not_rendered_again(self):
        state = {'articles': {}, 'videoBatches': {'latest': {'status': 'scheduled'}}}
        self.assertIsNone(worker.choose(state, [{'slug': 'latest', 'date': '2026-11-02'}]))

    def test_historical_baseline_and_receipts_are_preserved_by_batch_summary(self):
        state = {'articles': {'old': {'status': 'published', 'commentId': 'original-comment'}},
            'campaigns': {'2026-10': {'4': {'status': 'published'}}}}
        before = deepcopy(state)
        record = {'slug': 'new', 'status': 'scheduled', 'createdAt': 'now',
            'package': {'url': 'https://www.mcqsbase.com/blog/new'}, 'parts': []}
        worker.summary(state, record, type('Ledger', (), {'path': 'batches/new.json'})())
        self.assertEqual(state['articles'], before['articles'])
        self.assertEqual(state['campaigns'], before['campaigns'])
        self.assertEqual(state['videoBatches']['new']['ledger'], 'batches/new.json')

    def test_invalid_source_slug_cannot_write_outside_batch_directory(self):
        with self.assertRaises(ValueError):
            worker.Ledger(None, '../state')

    def test_verify_only_cannot_import_or_schedule_a_ready_batch(self):
        class NoAPI:
            def call(self, *_):
                raise AssertionError('Unexpected provider write/read for an unscheduled batch')
        state = {'videoBatches': {'new': {'status': 'ready'}}}
        with patch.object(worker, 'Ledger', side_effect=AssertionError('Unexpected ledger write')):
            worker.publish(None, state, {}, NoAPI(), 30, verify_only=True)

    @unittest.skipUnless(worker.POLICY['enabled'], 'Only applies after the new route is enabled')
    def test_legacy_entry_points_skip_without_cloud_credentials(self):
        for script, key in [('plan-blog-video-campaign.py', 'generate'), ('plan-metricool-handoff.py', 'handoff')]:
            with tempfile.TemporaryDirectory() as temp:
                output = Path(temp) / 'output.txt'
                env = {**os.environ, 'GITHUB_OUTPUT': str(output)}
                env.pop('GH_TOKEN', None)
                env.pop('GITHUB_REPOSITORY', None)
                result = subprocess.run([sys.executable, str(Path(__file__).with_name(script))], env=env,
                    capture_output=True, text=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(key + '=false', output.read_text())


if __name__ == '__main__':
    unittest.main()
