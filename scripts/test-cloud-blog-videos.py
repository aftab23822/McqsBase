import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

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


if __name__ == '__main__':
    unittest.main()
