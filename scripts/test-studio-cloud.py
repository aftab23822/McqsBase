"""Behavioral tests for partial writes, identity, free cost and duplicate prevention."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from email.message import Message
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('studio', Path(__file__).with_name('studio-cloud.py'))
studio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio)


def channels():
    return {name: {'id': name, 'identifier': name, 'name': 'McqsBase', 'profile': 'mcqsbase',
        'rules': {'maxLength': 10000, 'settings': {'required': [], 'properties': {}}}}
        for name in studio.NETWORKS}


def record():
    caption = {'text': 'Source questions 1–2\nPractice', 'sourceUrl': 'https://www.mcqsbase.com/blog/new-test',
        'firstCommentText': 'https://www.mcqsbase.com/blog/new-test', 'title': 'Actual source test', 'hashtags': ['#MCQsBase']}
    return {'status': 'ready', 'parts': [{'part': number, 'captions': {name: {**caption,
        'text': f'Part {number}/5 ' + caption['text']} for name in studio.NETWORKS},
        'studioMedia': {'id': str(number), 'path': f'https://media.example/{number}.mp4'}} for number in range(1, 6)]}


def slots():
    start = datetime.now(timezone.utc).replace(second=0, microsecond=0) + timedelta(minutes=30)
    return [(start + timedelta(minutes=5 * i)).isoformat() for i in range(5)]


class Fake:
    def __init__(self):
        self.calendar, self.writes, self.estimates = [], 0, []
        self.fail_after_write = False
        self.cost = 0
    def posts(self, start, end):
        return deepcopy(self.calendar)
    def call(self, method, path, payload=None):
        if path == '/wallet/estimate':
            self.estimates.append(payload)
            return {'usesWallet': True, 'charged': self.cost > 0, 'priceCredits': self.cost, 'dueCredits': self.cost}
        if path == '/posts':
            self.writes += 1
            result = []
            for item in payload['posts']:
                ident = str(len(self.calendar) + 1)
                self.calendar.append({'id': ident, 'content': item['value'][0]['content'],
                    'integration': item['integration'], 'publishDate': payload['date'], 'state': 'QUEUE'})
                result.append({'postId': ident, 'integration': item['integration']['id']})
            if self.fail_after_write:
                self.fail_after_write = False
                raise RuntimeError('A lost response after the posts were created')
            return result
        raise AssertionError((method, path))


class Publishing(unittest.TestCase):
    def test_verified_comment_only_repair_preserves_provider_error_and_never_reposts_video(self):
        fake, batch = Fake(), record()
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        part = batch['parts'][0]
        part['sha256'] = 'a' * 64
        fake.calendar[0].update(state='ERROR', releaseURL='https://www.facebook.com/reel/123', releaseId='123')
        proof = {'integrationId': 'facebook', 'videoSha256': 'a' * 64,
            'sourceUrl': part['captions']['facebook']['sourceUrl'], 'url': fake.calendar[0]['releaseURL'],
            'method': 'Directly verified public Reel and repaired Page comment', 'sourceCommentId': '456',
            'repairReleaseId': '123', 'resolvedProviderError': True}
        with patch.object(studio, 'PUBLIC_PROOFS', {'1': proof}):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        receipt = part['receipts']['facebook']
        self.assertEqual(receipt['providerStatus'], 'ERROR')
        self.assertEqual(receipt['status'], 'PUBLISHED')
        self.assertEqual(receipt['sourceCommentId'], '456')
        self.assertTrue(receipt['publicUrlVerified'])
        self.assertEqual(fake.writes, 20)

    def test_tiktok_profile_is_not_a_verified_public_video(self):
        self.assertFalse(studio.post_url('tiktok', 'https://www.tiktok.com/@mcqsbase'))
        self.assertTrue(studio.post_url('tiktok', 'https://www.tiktok.com/@mcqsbase/video/7702804896810011924'))

    def test_published_tiktok_profile_remains_provider_reported_only(self):
        fake, batch = Fake(), record()
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        for post in fake.calendar:
            post.update(state='PUBLISHED', releaseURL='https://www.tiktok.com/@mcqsbase')
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(batch['status'], 'provider-published')
        self.assertFalse(batch['parts'][0]['receipts']['tiktok']['publicUrlVerified'])
        self.assertEqual(fake.writes, 20)

    def test_complete_batch_and_idempotent_retry(self):
        fake, batch, saves = Fake(), record(), []
        studio.schedule_batch(fake, batch, channels(), lambda r: saves.append(deepcopy(r)), slots())
        self.assertEqual(len(fake.calendar), 20)
        self.assertEqual(fake.writes, 20)
        self.assertEqual(batch['status'], 'scheduled')
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 20)
        self.assertTrue(any(r['parts'][0].get('receipts', {}).get('facebook', {}).get('status') == 'uncertain' for r in saves))

    def test_lost_response_recovers_exact_posts_without_recreating(self):
        fake, batch = Fake(), record()
        fake.fail_after_write = True
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(fake.calendar), 16)
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(fake.calendar), 20)
        self.assertEqual(fake.writes, 20)

    def test_uncertain_absent_write_is_held(self):
        fake, batch = Fake(), record()
        fake.fail_after_write = True
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        fake.calendar = []
        with self.assertRaisesRegex(RuntimeError, 'uncertain'):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 16)

    def test_incomplete_batch_never_writes(self):
        fake, batch = Fake(), record()
        batch['parts'].pop()
        with self.assertRaises(ValueError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 0)

    def test_paid_cost_never_writes(self):
        fake = Fake()
        fake.cost = .1
        with self.assertRaisesRegex(RuntimeError, 'no longer free'):
            studio.schedule_batch(fake, record(), channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 0)

    def test_fb_source_comment_and_tiktok_actual_publication_mode(self):
        batch = record()
        facebook = studio.post_item('facebook', channels()['facebook'], batch['parts'][0]['captions']['facebook'], batch['parts'][0]['studioMedia'])
        self.assertEqual(facebook['value'][1]['content'], batch['parts'][0]['captions']['facebook']['sourceUrl'])
        self.assertEqual(facebook['value'][1]['delay'], 1)
        tiktok = studio.post_item('tiktok', channels()['tiktok'], batch['parts'][0]['captions']['tiktok'], batch['parts'][0]['studioMedia'])
        self.assertEqual(tiktok['settings']['content_posting_method'], 'DIRECT_POST')
        self.assertEqual(tiktok['settings']['privacy_level'], 'PUBLIC_TO_EVERYONE')
        self.assertEqual(tiktok['settings']['autoAddMusic'], 'no')

    def test_false_published_status_without_public_url_held(self):
        fake, batch = Fake(), record()
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        fake.calendar[0]['state'] = 'PUBLISHED'
        with self.assertRaisesRegex(RuntimeError, 'public receipt'):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())

    def test_duplicate_calendar_match_held(self):
        fake, batch = Fake(), record()
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        fake.calendar.append(deepcopy(fake.calendar[0]))
        with self.assertRaisesRegex(RuntimeError, 'Duplicate'):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())

    def test_schema_change_holds_only_the_affected_network(self):
        changed = channels()
        changed['youtube']['rules']['settings']['required'] = ['newConsent']
        api, batch = Fake(), record()
        with self.assertRaisesRegex(RuntimeError, 'newConsent'):
            studio.schedule_batch(api, batch, changed, lambda r: None, slots())
        self.assertEqual(len(api.calendar), 15)
        self.assertTrue(all(p['integration']['id'] != 'youtube' for p in api.calendar))
        self.assertEqual(batch['status'], 'partially-scheduled')

    def test_disconnected_tiktok_does_not_block_other_networks_and_resumes_missing_only(self):
        api, batch, connected = Fake(), record(), channels()
        connected['tiktok']['blockedReason'] = 'Reconnect the existing TikTok channel.'
        with self.assertRaisesRegex(RuntimeError, 'Reconnect'):
            studio.schedule_batch(api, batch, connected, lambda r: None, slots())
        self.assertEqual(len(api.calendar), 15)
        original = {p['id'] for p in api.calendar}
        frozen = deepcopy(batch['schedule'])
        studio.schedule_batch(api, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(api.calendar), 20)
        self.assertEqual(api.writes, 20)
        self.assertTrue(original.issubset({p['id'] for p in api.calendar}))
        self.assertEqual(batch['schedule'], frozen)
        self.assertEqual(batch['status'], 'scheduled')

    def test_existing_queued_tiktok_posts_can_be_reconciled_while_token_is_unavailable(self):
        api, batch = Fake(), record()
        studio.schedule_batch(api, batch, channels(), lambda r: None, slots())
        connected = channels()
        connected['tiktok']['blockedReason'] = 'Reconnect needed for new posts.'
        studio.schedule_batch(api, batch, connected, lambda r: None, slots())
        self.assertEqual(api.writes, 20)

    def test_expired_missing_slots_are_held_without_reposting_successful_networks(self):
        api, batch, connected = Fake(), record(), channels()
        connected['tiktok']['blockedReason'] = 'Reconnect needed.'
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(api, batch, connected, lambda r: None, slots())
        past = datetime.now(timezone.utc) - timedelta(days=1)
        batch['schedule'] = [(past + timedelta(minutes=5 * i)).isoformat() for i in range(5)]
        for part, when in zip(batch['parts'], batch['schedule']):
            part['scheduledAt'] = when
            for post in api.calendar:
                if post['content'] == part['payloads'][post['integration']['id']]['value'][0]['content']:
                    post['publishDate'] = when
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(api, batch, channels(), lambda r: None, slots())
        self.assertEqual(api.writes, 15)
        self.assertEqual(batch['status'], 'publication-needs-attention')

    def test_a_definite_network_rejection_preserves_other_fifteen_posts(self):
        class Rejected(Fake):
            def call(self, method, path, payload=None):
                if path == '/posts' and payload['posts'][0]['integration']['id'] == 'tiktok':
                    raise studio.StudioError(400, 'TikTok rejected the settings')
                return super().call(method, path, payload)
        api, batch = Rejected(), record()
        with self.assertRaisesRegex(RuntimeError, 'TikTok rejected'):
            studio.schedule_batch(api, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(api.calendar), 15)
        self.assertEqual(batch['status'], 'partially-scheduled')


class Transport(unittest.TestCase):
    def error(self, status, message='temporary failure', retry_after=None):
        headers = Message()
        if retry_after is not None:
            headers['Retry-After'] = retry_after
        return studio.urllib.error.HTTPError('https://studio.voholabs.com/api/public/v1/wallet', status,
            'failed', headers, io.BytesIO(json.dumps({'message': message}).encode()))

    def test_safe_read_retries_temporary_failure_and_honors_retry_after(self):
        opener = unittest.mock.Mock(side_effect=[self.error(503, retry_after='2'), io.BytesIO(b'{"ok":true}')])
        sleep = unittest.mock.Mock()
        api = studio.Studio(key='test-secret', open_request=opener, sleep=sleep)
        self.assertEqual(api.call('GET', '/wallet'), {'ok': True})
        self.assertEqual(opener.call_count, 2)
        sleep.assert_called_once_with(2)

    def test_authentication_failure_is_not_retried_or_logged_with_secret(self):
        opener = unittest.mock.Mock(side_effect=self.error(401, 'invalid test-secret'))
        api = studio.Studio(key='test-secret', open_request=opener, sleep=lambda _: None)
        with self.assertRaises(studio.StudioError) as caught:
            api.call('GET', '/wallet')
        self.assertNotIn('test-secret', str(caught.exception))
        self.assertIn('Cloud API access', str(caught.exception))
        self.assertEqual(opener.call_count, 1)

    def test_write_is_never_automatically_retried_after_server_failure(self):
        opener = unittest.mock.Mock(side_effect=self.error(503))
        api = studio.Studio(key='test-secret', open_request=opener, sleep=lambda _: None)
        with self.assertRaises(studio.StudioError):
            api.call('POST', '/posts', {'posts': []})
        self.assertEqual(opener.call_count, 1)

    def test_rate_limit_long_wait_is_deferred_without_early_retry(self):
        opener = unittest.mock.Mock(side_effect=self.error(429, retry_after='300'))
        sleep = unittest.mock.Mock()
        api = studio.Studio(key='test-secret', open_request=opener, sleep=sleep)
        with self.assertRaisesRegex(studio.StudioError, 'longer wait'):
            api.call('GET', '/wallet')
        self.assertEqual(opener.call_count, 1)
        sleep.assert_not_called()

    def test_safe_creator_lookup_retries_but_upload_does_not(self):
        for path, payload, expected in [('/integration-trigger/tiktok', {'methodName': 'creatorInfo'}, 3),
                                        ('/upload-from-url', {'url': 'https://media.example/video.mp4'}, 1)]:
            opener = unittest.mock.Mock(side_effect=studio.urllib.error.URLError('network unavailable'))
            api = studio.Studio(key='test-secret', open_request=opener, sleep=lambda _: None)
            with self.assertRaises(RuntimeError):
                api.call('POST', path, payload)
            self.assertEqual(opener.call_count, expected)


class Connections(unittest.TestCase):
    def test_expired_tiktok_uses_supported_server_refresh_path_then_revalidates(self):
        api, policy, calls = self.provider(can_post=True)
        original = api.call
        count = [0]
        def call(method, path, payload=None):
            if path.startswith('/analytics/'):
                calls.append(path)
                return []  # Empty analytics alone cannot prove successful renewal.
            if path.startswith('/integration-trigger/'):
                count[0] += 1
                if count[0] == 1:
                    return {'output': {'canPost': False, 'errorCode': 'access_token_invalid'}}
            return original(method, path, payload)
        api.call = call
        actual = studio.connected(api, policy)
        self.assertEqual(count[0], 2)
        self.assertEqual(sum(p.startswith('/analytics/') for p in calls), 1)
        self.assertEqual(actual['tiktok']['authRecovery'], 'creator-verified-after-studio-renewal')
        self.assertNotIn('blockedReason', actual['tiktok'])

    def test_failed_server_renewal_is_bounded_and_never_treated_as_success(self):
        api, policy, calls = self.provider(can_post=False)
        original = api.call
        def call(method, path, payload=None):
            if path.startswith('/analytics/'):
                calls.append(path)
                return []
            value = original(method, path, payload)
            if path.startswith('/integration-trigger/'):
                value['output']['errorCode'] = 'access_token_invalid'
            return value
        api.call = call
        actual = studio.connected(api, policy)
        self.assertEqual(sum(p.startswith('/analytics/') for p in calls), 1)
        self.assertEqual(sum(p.startswith('/integration-trigger/') for p in calls), 2)
        self.assertIn('blockedReason', actual['tiktok'])
        self.assertEqual(actual['tiktok']['authRecovery'], 'attempted-studio-renewal')
        self.assertTrue(all('blockedReason' not in actual[n] for n in ('facebook', 'instagram', 'youtube')))

    def test_non_expiry_tiktok_restrictions_do_not_trigger_token_renewal(self):
        api, policy, calls = self.provider(can_post=False)
        actual = studio.connected(api, policy)
        self.assertNotIn('authRecovery', actual['tiktok'])
        self.assertFalse(any(p.startswith('/analytics/') for p in calls))

    def provider(self, can_post=False):
        expected = channels()
        calls = []
        def call(method, path, payload=None):
            calls.append(path)
            if path == '/wallet':
                return {'usesWallet': True, 'payAsYouGo': False, 'autoTopUp': {'enabled': False}}
            if path == '/integrations':
                return [{**value, 'disabled': False} for value in expected.values()]
            if path.startswith('/integration-settings/'):
                return {'output': {'maxLength': 10000, 'settings': {}}}
            if path.startswith('/integration-trigger/'):
                return {'output': {'canPost': can_post, 'username': 'mcqsbase', 'errorCode': 'token_expired',
                                   'privacyLevelOptions': ['PUBLIC_TO_EVERYONE'], 'maxVideoPostDurationSec': 600}}
            raise AssertionError(path)
        return type('API', (), {'call': staticmethod(call)})(), {'channels': expected, 'maxDurationSeconds': 89}, calls

    def test_tiktok_expiry_is_reported_without_disabling_other_channels(self):
        api, policy, calls = self.provider()
        actual = studio.connected(api, policy)
        self.assertIn('token_expired', actual['tiktok']['blockedReason'])
        for network in ('facebook', 'instagram', 'youtube'):
            self.assertTrue(actual[network]['identityVerified'])
            self.assertNotIn('blockedReason', actual[network])

    def test_verify_only_uses_identities_but_no_wallet_or_posting_capability(self):
        api, policy, calls = self.provider()
        actual = studio.connected(api, policy, verify_only=True)
        self.assertEqual(calls, ['/integrations'])
        self.assertTrue(all(c['identityVerified'] for c in actual.values()))

    def test_healthy_tiktok_is_still_required_to_confirm_everyone_and_duration(self):
        api, policy, calls = self.provider(can_post=True)
        self.assertNotIn('blockedReason', studio.connected(api, policy)['tiktok'])
        policy['maxDurationSeconds'] = 900
        self.assertIn('shorter video', studio.connected(api, policy)['tiktok']['blockedReason'])


if __name__ == '__main__':
    unittest.main()
