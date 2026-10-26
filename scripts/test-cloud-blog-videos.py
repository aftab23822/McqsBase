import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('cloud', Path(__file__).with_name('cloud-blog-videos.py'))
cloud = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cloud)


class CloudPublishingTests(unittest.TestCase):
    def test_state_does_not_export_local_machine_paths(self):
        result = cloud.portable_state({'lastCheckedAt': 'now', 'articles': {'test': {
            'slug': 'test', 'video': 'C:/private/local.mp4', 'manifest': 'C:/local.json',
            'metricoolPostId': '123', 'publishingStatus': 'published'}}})
        self.assertNotIn('lastCheckedAt', result)
        self.assertNotIn('video', result['articles']['test'])
        self.assertEqual(result['articles']['test']['metricoolPostId'], '123')

    def test_existing_state_branch_with_missing_queue_is_not_reset(self):
        storage = cloud.GitHubState('owner/repo', 'example')
        missing = Mock(status_code=404)
        present = Mock(status_code=200)
        storage.http.get = Mock(side_effect=[missing, present])
        with self.assertRaisesRegex(RuntimeError, 'queue is missing'):
            storage.load()

    def test_unchanged_state_does_not_create_a_commit(self):
        storage = cloud.GitHubState('owner/repo', 'example')
        state = {'articles': {'test': {'slug': 'test', 'status': 'ready'}}}
        storage.loaded = True
        storage.sha = 'existing'
        storage.previous = cloud.portable_state(state)
        storage.http.request = Mock()
        storage.save(state)
        storage.http.request.assert_not_called()

    def test_preview_and_unsuccessful_deployments_cannot_supply_questions(self):
        storage = Mock()
        storage.api.return_value = [{'id': 1, 'sha': 'a' * 40, 'environment': 'Preview',
                                     'creator': {'login': 'vercel[bot]'}}]
        with self.assertRaisesRegex(RuntimeError, 'not successfully deployed'):
            cloud.production_deployment(storage, 'a' * 40, attempts=1)
        with self.assertRaises(ValueError):
            cloud.deployed_sources({'sha': 'a' * 40, 'state': 'success', 'environment': 'Preview'}, {}, [])

    def test_successful_exact_production_deployment_is_required(self):
        storage = Mock()
        storage.api.side_effect = [[{'id': 1, 'sha': 'a' * 40, 'environment': 'Production',
                                     'creator': {'login': 'vercel[bot]'}}], [{'state': 'success', 'environment_url': 'https://example.vercel.app'}]]
        proof = cloud.production_deployment(storage, 'a' * 40, attempts=1)
        self.assertEqual(proof['sha'], 'a' * 40)
        self.assertEqual(proof['state'], 'success')

    def test_deployed_questions_are_validated_and_older_unseen_articles_excluded(self):
        proof = {'sha': 'a' * 40, 'state': 'success', 'environment': 'Production', 'verifiedAt': 'now'}
        body = '| 1 | Test?<br />A) One<br />B) Two<br />C) Three<br />D) Four | **B) Two** |'
        articles = [{'slug': 'new-test', 'title': '100 Real Test MCQs', 'date': '2026-10-27', 'body': body},
                    {'slug': 'old-test', 'title': 'Old', 'date': '2026-10-01', 'body': body}]
        snapshot = cloud.deployed_sources(proof, {'initializedAt': '2026-10-26', 'articles': {}}, articles)
        self.assertEqual([entry['slug'] for entry in snapshot['articles']], ['new-test'])
        package = snapshot['packages']['new-test']
        self.assertFalse(package['verifiedLive'])
        self.assertEqual(package['questions'][0]['correctIndex'], 1)
        self.assertEqual(package['verification'], 'production-deployment')

    def test_failed_blog_publisher_prevents_manual_generation(self):
        storage = Mock()
        storage.api.return_value = {'workflow_runs': [{'id': 2, 'status': 'completed', 'conclusion': 'failure'}]}
        with patch.dict(cloud.os.environ, {'GITHUB_EVENT_NAME': 'workflow_dispatch'}):
            with self.assertRaisesRegex(RuntimeError, 'not completed successfully'):
                cloud.successful_blog_run(storage)

    def test_filled_campaign_window_never_checks_deployment_or_calls_the_renderer(self):
        storage = Mock()
        storage.load.return_value = {'articles': {}}
        with patch.dict(cloud.os.environ, {'GITHUB_REPOSITORY': 'owner/repo', 'GH_TOKEN': 'example'}), \
                patch.object(cloud, 'GitHubState', return_value=storage), \
                patch.object(cloud, 'successful_blog_run', return_value=123), \
                patch.object(cloud.planner, 'plan_campaign', return_value={'generate': False, 'reason': 'filled'}), \
                patch.object(cloud, 'production_deployment') as deploy, \
                patch.object(cloud.watcher, 'run') as render:
            cloud.main()
            deploy.assert_not_called()
            render.assert_not_called()

    def test_campaign_is_reserved_before_only_the_selected_article_renders(self):
        storage = Mock()
        storage.load.return_value = {'initializedAt': '2026-10-26', 'articles': {}}
        snapshot = {'articles': [
            {'slug': slug, 'url': f'https://www.mcqsbase.com/blog/{slug}', 'listedTitle': slug}
            for slug in ('selected-test', 'other-test')], 'packages': {}}
        with tempfile.TemporaryDirectory() as tmp:
            def render(args, source_snapshot, render_slugs):
                self.assertEqual(render_slugs, {'selected-test'})
                path = Path(args.state_dir) / 'state.json'
                saved = json.loads(path.read_text())
                self.assertEqual(saved['articles']['other-test']['status'], 'not-selected')
                self.assertEqual(saved['articles']['selected-test']['campaign']['reservedPublications'], 4)
                output = Path(tmp) / 'video'
                output.mkdir()
                saved['articles']['selected-test'].update(status='ready', video=str(output / 'quiz.mp4'))
                cloud.watcher.save_json(path, saved)
            with patch.dict(cloud.os.environ, {'GITHUB_REPOSITORY': 'owner/repo', 'GH_TOKEN': 'example', 'GITHUB_RUN_ID': '1'}), \
                    patch.object(cloud, 'ROOT', Path(tmp)), patch.object(cloud, 'GitHubState', return_value=storage), \
                    patch.object(cloud, 'successful_blog_run', return_value=123), \
                    patch.object(cloud.planner, 'plan_campaign', return_value={'generate': True, 'slug': 'selected-test'}), \
                    patch.object(cloud.subprocess, 'check_output', return_value='a' * 40), \
                    patch.object(cloud, 'production_deployment', return_value={}), \
                    patch.object(cloud, 'deployed_sources', return_value=snapshot), \
                    patch.object(cloud.watcher, 'run', side_effect=render), \
                    patch.object(cloud.social, 'publication_window', return_value={
                        'month': '2026-11', 'window': 1, 'scheduledFor': '2026-11-02T20:00:00+05:00'}):
                cloud.main()
            saved = json.loads((Path(tmp) / '.social-automation/blog-videos/state.json').read_text())
            self.assertEqual(saved['campaigns']['2026-11']['1']['status'], 'awaiting-metricool-scheduling')


if __name__ == '__main__':
    unittest.main()
