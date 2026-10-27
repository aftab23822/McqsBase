"""Exercise the publication boundary with simulated platform replies only."""
from copy import deepcopy
import importlib.util
from io import BytesIO
import json
from pathlib import Path
from urllib.error import URLError
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cloud_publish', ROOT / 'scripts/metricool-cloud-publish.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class CloudPublishingTests(unittest.TestCase):
    def setUp(self):
        self.info = {'draft': False, 'autoPublish': True, 'text': 'Source quiz #MCQsBase',
                     'firstCommentText': 'Full set: https://www.mcqsbase.com/blog/example',
                     'publicationDate': {'dateTime': '2026-11-02T20:00:00', 'timezone': 'Asia/Karachi'},
                     'facebookData': {'type': 'REEL'}}
        self.post = {**deepcopy(self.info), 'id': 123, 'uuid': 'stable-id',
                     'media': ['https://static.metricool.com/test.mp4'],
                     'providers': [{'network': 'facebook', 'status': 'PENDING'}]}

    def test_schedule_is_not_claimed_published_or_comment_verified(self):
        receipt = publisher.verify_post(self.post, 'facebook', self.info)
        self.assertEqual(receipt['status'], 'scheduled')
        self.assertEqual(receipt['firstCommentStatus'], 'configured-with-post')
        self.post['providers'][0]['status'] = 'PUBLISHED'
        receipt = publisher.verify_post(self.post, 'facebook', self.info)
        self.assertEqual(receipt['status'], 'published')
        self.assertEqual(receipt['firstCommentStatus'], 'awaiting-public-verification')

    def test_wrong_caption_comment_format_or_draft_is_rejected(self):
        for key, value in [('text', 'Wrong quiz'), ('firstCommentText', ''), ('draft', True),
                           ('facebookData', {'type': 'POST'})]:
            with self.subTest(key=key):
                changed = {**self.post, key: value}
                with self.assertRaises(RuntimeError):
                    publisher.verify_post(changed, 'facebook', self.info)

    def test_duplicate_matches_are_held(self):
        with self.assertRaisesRegex(RuntimeError, 'Multiple matching'):
            publisher.find_post([self.post, {**self.post, 'uuid': 'other'}], 'facebook', self.info, {})

    def test_uncertain_write_never_creates_again(self):
        ledger = {'month': '2026-11', 'networks': {'facebook': {'status': 'uncertain'}}}
        class NoWrites:
            def call(self, *args):
                raise AssertionError('A duplicate create was attempted')
        with self.assertRaisesRegex(RuntimeError, 'never create it again'):
            publisher.send_missing(NoWrites(), {'facebook': {'info': json.dumps(self.info)}},
                                   ledger, [], lambda: None)

    def test_lost_response_reconciles_existing_uuid_and_skips_create(self):
        ledger = {'month': '2026-11', 'networks': {'facebook': {'status': 'uncertain'}}}
        post = self.post
        class CalendarOnly:
            def call(self, operation, arguments):
                self_operation = operation
                if self_operation != 'getScheduledPosts':
                    raise AssertionError('A duplicate create was attempted')
                return {'data': [post]}
        publisher.send_missing(CalendarOnly(), {'facebook': {'info': json.dumps(self.info)}},
                               ledger, [post], lambda: None)
        self.assertEqual(ledger['networks']['facebook']['uuid'], 'stable-id')

    def test_receipt_ids_survive_a_failed_post_validation(self):
        receipt, saves = {'status': 'uncertain'}, []
        with self.assertRaises(RuntimeError):
            publisher.apply_receipt(receipt, {**self.post, 'draft': True}, 'facebook', self.info,
                                    lambda: saves.append(deepcopy(receipt)))
        self.assertEqual(saves[0]['postId'], 123)
        self.assertEqual(saves[0]['status'], 'uncertain')

    def test_real_usage_and_partial_reservations_consume_capacity(self):
        campaigns = {str(i): {'reservedPublications': 4, 'networks': {}} for i in range(1, 5)}
        state = {'campaigns': {'2026-11': campaigns}}
        posts = [{**self.post, 'uuid': str(i)} for i in range(5)]
        with self.assertRaisesRegex(RuntimeError, 'insufficient free-plan capacity'):
            publisher.check_capacity(state, '2026-11', posts)
        publisher.check_capacity(state, '2026-11', posts[:4])
        posts[4]['draft'] = True
        publisher.check_capacity(state, '2026-11', posts)

    def test_bridge_does_not_retry_or_expose_endpoint_and_key(self):
        calls = []
        class Offline:
            def open(self, request, timeout):
                calls.append(request)
                raise URLError('secret endpoint and secret key must not appear')
        client = publisher.bridge.MakeClient('https://hook.eu1.make.com/privateendpoint',
                                             'private-key', Offline())
        with self.assertRaises(publisher.bridge.BridgeError) as caught:
            client.call('createScheduledPost', {})
        self.assertEqual(len(calls), 1)
        self.assertNotIn('private', str(caught.exception))
        self.assertNotIn('secret', str(caught.exception))

    def test_accepted_without_receipt_is_not_success(self):
        class Accepted(BytesIO):
            status = 200
        class QueueOnly:
            def open(self, request, timeout):
                return Accepted(b'Accepted')
        client = publisher.bridge.MakeClient('https://hook.eu1.make.com/privateendpoint',
                                             'private-key', QueueOnly())
        with self.assertRaisesRegex(publisher.bridge.BridgeError, 'without a verified Metricool result'):
            client.call('getBrandSettings')

    def test_approved_launch_updates_the_existing_draft_and_retains_its_uuid(self):
        original = {**self.post, 'draft': True, 'text': 'DRAFT TEST', 'unrelatedField': 'preserve-me'}
        campaign = {'networks': {'facebook': {'status': 'approved-draft', 'postId': 123, 'uuid': 'stable-id'}}}
        calls, saved = [], []
        class UpdateOnly:
            def call(self, operation, arguments):
                calls.append((operation, arguments))
                info = json.loads(arguments['info'])
                return {'data': {**info, 'id': 456}}
        publisher.promote_approved_drafts(UpdateOnly(), {'facebook': {'info': json.dumps(self.info)}},
            campaign, [original], lambda: saved.append(deepcopy(campaign)))
        self.assertEqual(calls[0][0], 'updateScheduledPost')
        self.assertEqual(calls[0][1]['id'], '123')
        self.assertEqual(calls[0][1]['uuid'], 'stable-id')
        self.assertEqual(json.loads(calls[0][1]['info'])['unrelatedField'], 'preserve-me')
        self.assertEqual(saved[0]['networks']['facebook']['status'], 'uncertain-update')
        self.assertEqual(campaign['networks']['facebook']['postId'], 456)

    def test_uncertain_draft_update_never_repeats_the_update(self):
        campaign = {'networks': {'facebook': {'status': 'uncertain-update', 'postId': 123, 'uuid': 'stable-id'}}}
        class NoWrites:
            def call(self, *args):
                raise AssertionError('An uncertain update was repeated')
        with self.assertRaisesRegex(RuntimeError, 'earlier draft update is uncertain'):
            publisher.promote_approved_drafts(NoWrites(), {'facebook': {'info': json.dumps(self.info)}},
                campaign, [{**self.post, 'draft': True}], lambda: None)


if __name__ == '__main__':
    unittest.main()
