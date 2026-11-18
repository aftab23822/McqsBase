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
    def test_upload_rejection_can_resume_but_uncertain_writes_require_reconciliation(self):
        from unittest.mock import Mock
        for failure, expected in [(worker.publisher.StudioError(400, 'rejected'), 'rejected'),
                                  (worker.publisher.StudioError(503, 'unavailable'), 'uncertain'),
                                  (TimeoutError(), 'uncertain')]:
            part, saved = {}, []
            client = Mock()
            client.upload_video.side_effect = failure
            with self.assertRaises(type(failure)):
                worker.upload_part(client, part, 'example.mp4', b'video',
                                   lambda: saved.append(deepcopy(part['uploadIntent'])))
            self.assertEqual(saved[0]['status'], 'uncertain')
            self.assertEqual(saved[-1]['status'], expected)
            client.upload_video.assert_called_once_with('example.mp4', b'video')

    def test_random_plan_is_durable_before_render_and_is_reused_after_failure(self):
        fixture = worker.module('worker_batch_fixture', 'test-quiz-batch.py')
        package = fixture.source()
        saved = []
        ledger = type('Ledger', (), {'path': 'batches/example-quiz.json',
            'load': lambda _: deepcopy(saved[-1]) if saved else None,
            'save': lambda _, record: saved.append(deepcopy(record))})()
        storage = type('Storage', (), {'save': lambda *_: None})()
        with tempfile.TemporaryDirectory() as tmp, patch.object(worker, 'ROOT', Path(tmp)), \
             patch.object(worker, 'Ledger', return_value=ledger), \
             patch.object(worker.subprocess, 'check_output', return_value='b' * 40), \
             patch.object(worker.cloud, 'production_deployment', return_value=deepcopy(package['productionDeployment'])), \
             patch.object(worker.cloud, 'deployed_sources', return_value={'packages': {package['slug']: package}}), \
             patch.object(worker.batcher, 'build_batch', side_effect=RuntimeError('simulated interrupted render')):
            with self.assertRaisesRegex(RuntimeError, 'interrupted'):
                worker.generate(storage, {}, package['slug'], 123)
            first = deepcopy(saved[0]['package']['selectionPlan'])
            self.assertEqual(len(first['sourceQuestionNumbers']), 100)
            with patch.object(worker.batcher, 'selection_plan', side_effect=AssertionError('reshuffled on retry')):
                with self.assertRaisesRegex(RuntimeError, 'interrupted'):
                    worker.generate(storage, {}, package['slug'], 123)
            self.assertEqual(saved[-1]['package']['selectionPlan'], first)

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
        self.assertEqual(api.writes, 20)

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
        self.assertEqual(api.writes, 20)
        self.assertEqual(state['videoBatches']['recent']['published'], 20)
        self.assertEqual(state['videoBatches']['recent']['verifiedPublications'], 0)

    def test_obsolete_metricool_publishers_and_workflows_are_removed(self):
        for filename in ('metricool-cloud-publish.py', 'metricool-campaign-payload.py',
                         'plan-metricool-handoff.py', 'cloud-blog-videos.py'):
            self.assertFalse((worker.ROOT / 'scripts' / filename).exists())
        self.assertFalse((worker.ROOT / '.github/workflows/metricool-cloud-handoff.yml').exists())
        workflow = (worker.ROOT / '.github/workflows/blog-quiz-batches.yml').read_text()
        self.assertIn("workflows: ['Daily Blog Autopilot']", workflow)
        self.assertIn("github.event_name == 'schedule'", workflow)  # Self-healing retry only.
        self.assertNotIn('MCQS_MAKE', workflow)

    def plan(self, state, articles, event='schedule', hour=12, deployed=None, blog_ok=True):
        storage = type('Storage', (), {'sha': 'existing-state', 'load': lambda _: state})()
        blog = patch.object(worker.cloud, 'successful_blog_run', return_value=1) if blog_ok else \
            patch.object(worker.cloud, 'successful_blog_run', side_effect=RuntimeError('publisher failed'))
        with tempfile.TemporaryDirectory() as temp, blog, \
             patch.object(worker.cloud, 'GitHubState', return_value=storage), \
             patch.object(worker.cloud, 'find_production_deployment', return_value=deployed), \
             patch.object(worker, 'local_hour', return_value=hour), \
             patch.object(worker, 'head_sha', return_value='a' * 40), \
             patch.object(worker.subprocess, 'check_output', return_value=json.dumps(articles)), \
             patch.object(sys, 'argv', ['worker', '--phase', 'plan']), \
             patch.dict(os.environ, {'GH_TOKEN': 'test', 'GITHUB_REPOSITORY': 'owner/repo', 'GITHUB_EVENT_NAME': event,
                                     'GITHUB_OUTPUT': str(Path(temp) / 'output')}):
            worker.main()
            return (Path(temp) / 'output').read_text()

    def test_scheduled_retry_never_polls_existing_receipts(self):
        state = {'articles': {}, 'videoBatches': {'latest': {'status': 'scheduled'}}}
        output = self.plan(state, [{'slug': 'latest', 'date': '2026-11-02'}])
        self.assertIn('generate=false', output)
        self.assertIn('work=false', output)
        self.assertIn('work=true', self.plan(state, [{'slug': 'latest', 'date': '2026-11-02'}], event='workflow_dispatch'))

    def test_scheduled_retry_is_a_quiet_no_op_when_the_blog_publisher_failed(self):
        output = self.plan({'articles': {}}, [{'slug': 'latest', 'date': '2026-11-02'}], blog_ok=False)
        self.assertIn('generate=false', output)
        with self.assertRaisesRegex(RuntimeError, 'publisher failed'):
            self.plan({'articles': {}}, [{'slug': 'latest', 'date': '2026-11-02'}], event='workflow_dispatch', blog_ok=False)

    def test_scheduled_retry_renders_a_waiting_batch_only_once_it_is_live_and_early_enough(self):
        state = {'articles': {}, 'videoBatches': {'latest': {'status': 'awaiting-deployment', 'sourceSha': 'a' * 40}}}
        articles = [{'slug': 'latest', 'date': '2026-11-02'}]
        self.assertIn('generate=false', self.plan(state, articles, deployed=None))
        self.assertIn('generate=true\nwork=true', self.plan(state, articles, deployed={'state': 'success'}))
        self.assertIn('generate=false', self.plan(state, articles, deployed={'state': 'success'}, hour=21))

    def test_missing_deployment_keeps_the_article_queued_instead_of_failing(self):
        ledger = type('Ledger', (), {'path': 'batches/latest.json', 'load': lambda _: None,
                                     'save': lambda *_: self.fail('No ledger before a deployment')})()
        saved = []
        storage = type('Storage', (), {'save': lambda _, state: saved.append(deepcopy(state))})()
        state = {'articles': {}}
        with patch.object(worker, 'Ledger', return_value=ledger), \
             patch.object(worker.subprocess, 'check_output', return_value='a' * 40), \
             patch.object(worker.cloud, 'production_deployment', side_effect=worker.cloud.DeploymentPending('not live')):
            self.assertFalse(worker.generate(storage, state, 'latest', 1))
            worker.generate(storage, state, 'latest', 1)
        entry = saved[-1]['videoBatches']['latest']
        self.assertEqual(entry['status'], 'awaiting-deployment')
        self.assertEqual(entry['deploymentChecks'], 2)
        self.assertEqual(worker.choose(state, [{'slug': 'latest', 'date': '2026-11-02'}]), 'latest')
        self.assertIsNone(worker.choose(state, [{'slug': 'latest', 'date': '2026-11-02'}], exclude={'latest'}))

    def test_waiting_article_is_retired_when_a_newer_article_arrives(self):
        state = {'articles': {}, 'videoBatches': {'older': {'status': 'awaiting-deployment'}}}
        articles = [{'slug': 'newest', 'date': '2026-11-03'}, {'slug': 'older', 'date': '2026-11-02'}]
        worker.retire_superseded(state, articles)
        self.assertEqual(state['videoBatches']['older']['status'], 'skipped')
        self.assertEqual(worker.choose(state, articles), 'newest')

    def test_repeated_render_failures_stop_automatic_retries_but_not_manual_runs(self):
        state = {'articles': {}, 'videoBatches': {'stuck': {'status': 'rendering', 'renderFailures': 4}}}
        articles = [{'slug': 'stuck', 'date': '2026-11-02'}]
        self.assertIsNone(worker.choose(state, articles, automatic=True))
        self.assertEqual(worker.choose(state, articles), 'stuck')


if __name__ == '__main__':
    unittest.main()
