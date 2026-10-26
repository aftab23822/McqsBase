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
            'facebookVideoId': '123', 'publishingStatus': 'published'}}})
        self.assertNotIn('lastCheckedAt', result)
        self.assertNotIn('video', result['articles']['test'])
        self.assertEqual(result['articles']['test']['facebookVideoId'], '123')

    def test_missing_api_version_blocks_writes(self):
        with self.assertRaises(ValueError):
            cloud.FacebookPublisher('example', '', lambda: None)

    def test_wrong_page_token_never_uploads(self):
        publisher = cloud.FacebookPublisher('example', 'v23.0', lambda: None)
        publisher.request = Mock(return_value={'id': 'wrong-page'})
        with self.assertRaises(ValueError):
            publisher.publish({}, Path('unused'))
        self.assertEqual(publisher.request.call_count, 1)

    def test_uncertain_upload_is_not_repeated(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            (directory / 'caption.txt').write_text('Unique test caption')
            (directory / 'first-comment.txt').write_text('Full source URL')
            (directory / 'manifest.json').write_text(json.dumps({
                'sourceVerifiedLive': True, 'sourceUrl': 'https://www.mcqsbase.com/blog/test', 'title': 'Test'}))
            publisher = cloud.FacebookPublisher('example', 'v23.0', lambda: None)
            publisher.request = Mock(side_effect=[{'id': cloud.PAGE_ID}, {'data': []}])
            entry = {'url': 'https://www.mcqsbase.com/blog/test', 'facebookUploadIntentAt': 'earlier'}
            with self.assertRaisesRegex(RuntimeError, 'uncertain'):
                publisher.publish(entry, directory)
            self.assertTrue(all(call.args[0] == 'GET' for call in publisher.request.call_args_list))

    def test_existing_video_resumes_comment_without_uploading(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            (directory / 'caption.txt').write_text('Caption')
            (directory / 'first-comment.txt').write_text('Full source URL')
            (directory / 'manifest.json').write_text(json.dumps({
                'sourceVerifiedLive': True, 'sourceUrl': 'https://www.mcqsbase.com/blog/test', 'title': 'Test'}))
            publisher = cloud.FacebookPublisher('example', 'v23.0', lambda: None)
            publisher.request = Mock(side_effect=[{'id': cloud.PAGE_ID}, {
                'status': {'video_status': 'ready', 'publishing_phase': {'status': 'complete'}},
                'permalink_url': 'https://www.facebook.com/video'}, {'data': []},
                {'id': 'comment-1'}, {'id': 'comment-1', 'message': 'Full source URL'}])
            entry = {'url': 'https://www.mcqsbase.com/blog/test', 'facebookVideoId': 'video-1'}
            publisher.publish(entry, directory)
            writes = [call for call in publisher.request.call_args_list if call.args[0] == 'POST']
            self.assertEqual(len(writes), 1)
            self.assertEqual(writes[0].args[1], 'video-1/comments')
            self.assertEqual(entry['publishingStatus'], 'published')


if __name__ == '__main__':
    unittest.main()
