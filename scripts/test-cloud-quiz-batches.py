"""Publication selection and durable-state regressions for the new batch route."""
from copy import deepcopy
import importlib.util
import json
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
    def test_manual_verification_gate_keeps_provider_only_and_held_receipts_eligible(self):
        for status in ('provider-published', 'publication-needs-attention'):
            state = {'articles': {}, 'videoBatches': {'latest': {'status': status}}}
            storage = type('Storage', (), {'sha': 'existing-state', 'load': lambda _: state})()
            with tempfile.TemporaryDirectory() as temp, \
                 patch.object(worker.cloud, 'GitHubState', return_value=storage), \
                 patch.object(worker.subprocess, 'check_output', return_value=json.dumps([{'slug': 'latest', 'date': '2026-11-02'}])), \
                 patch.object(sys, 'argv', ['worker', '--phase', 'plan', '--verify-only']), \
                 patch.dict(os.environ, {'GH_TOKEN': 'test', 'GITHUB_REPOSITORY': 'owner/repo', 'GITHUB_OUTPUT': str(Path(temp) / 'output')}):
                worker.main()
                output = (Path(temp) / 'output').read_text()
                self.assertIn('generate=false', output)
                self.assertIn('work=true', output)

    def test_old_comment_failure_is_held_without_suppressing_a_new_ready_batch(self):
        fixture = worker.module('isolation_fixture', 'test-studio-cloud.py')
        old, api = fixture.record(), fixture.Fake()
        fixture.studio.schedule_batch(api, old, fixture.channels(), lambda r: None, fixture.slots())
        old.update(slug='old', createdAt='now', package={'url': 'https://www.mcqsbase.com/blog/old'})
        for post in api.calendar:
            post.update(state='PUBLISHED', releaseURL='https://www.tiktok.com/@mcqsbase')
        api.calendar[0]['state'] = 'ERROR'
        new = fixture.record()
        new.update(slug='new', createdAt='now', package={'url': 'https://www.mcqsbase.com/blog/new'})
        for part in new['parts']:
            part.update(manifest={}, sha256='a', asset={'videoSha256': 'a'})
        records = {'old': old, 'new': new}
        state = {'videoBatches': {'old': {'status': 'scheduled'}, 'new': {'status': 'ready'}}}
        def ledger_factory(storage, slug):
            return type('Ledger', (), {'path': f'batches/{slug}.json', 'load': lambda _: records[slug],
                                      'save': lambda _, record: records.update({slug: record})})()
        scheduled = []
        def schedule(api, record, channels, save, slots):
            scheduled.append(record['slug'])
            record['status'] = 'scheduled'
            record['schedule'] = slots
            save(record)
        storage = type('Storage', (), {'save': lambda *_: None})()
        with patch.object(worker, 'Ledger', side_effect=ledger_factory), \
             patch.object(worker.batcher, 'validate_part', return_value=1), \
             patch.object(worker.publisher, 'schedule_batch', side_effect=schedule):
            with self.assertRaisesRegex(RuntimeError, 'Other ready batches were processed'):
                worker.publish(storage, state, fixture.channels(), api, 30)
        self.assertEqual(scheduled, ['new'])
        self.assertEqual(records['old']['status'], 'publication-needs-attention')
        self.assertEqual(api.writes, 5)

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

    def test_explicit_verification_can_reconcile_provider_only_results_without_new_posts(self):
        fixture = worker.module('publisher_fixture', 'test-studio-cloud.py')
        batch, api = fixture.record(), fixture.Fake()
        fixture.studio.schedule_batch(api, batch, fixture.channels(), lambda r: None, fixture.slots())
        batch.update(status='provider-published', slug='recent', createdAt='now',
                     package={'url': 'https://www.mcqsbase.com/blog/new-test'})
        for post in api.calendar:
            post.update(state='PUBLISHED', releaseURL='https://www.tiktok.com/@mcqsbase')
        state = {'videoBatches': {'recent': {'status': 'provider-published'}}}
        ledger = type('Ledger', (), {'path': 'batches/recent.json', 'load': lambda _: batch,
                                   'save': lambda *_: None})()
        storage = type('Storage', (), {'save': lambda *_: None})()
        with patch.object(worker, 'Ledger', return_value=ledger):
            worker.publish(storage, state, fixture.channels(), api, 30, verify_only=True)
        self.assertEqual(api.writes, 5)
        self.assertEqual(state['videoBatches']['recent']['published'], 20)
        self.assertEqual(state['videoBatches']['recent']['verifiedPublications'], 0)

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
