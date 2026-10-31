"""Behavioral tests for partial writes, identity, free cost and duplicate prevention."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import importlib.util
from pathlib import Path
import unittest

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
        self.assertEqual(fake.writes, 5)

    def test_complete_batch_and_idempotent_retry(self):
        fake, batch, saves = Fake(), record(), []
        studio.schedule_batch(fake, batch, channels(), lambda r: saves.append(deepcopy(r)), slots())
        self.assertEqual(len(fake.calendar), 20)
        self.assertEqual(fake.writes, 5)
        self.assertEqual(batch['status'], 'scheduled')
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 5)
        self.assertTrue(any(r['parts'][0].get('receipts', {}).get('facebook', {}).get('status') == 'uncertain' for r in saves))

    def test_lost_response_recovers_exact_posts_without_recreating(self):
        fake, batch = Fake(), record()
        fake.fail_after_write = True
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(fake.calendar), 4)
        studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(len(fake.calendar), 20)
        self.assertEqual(fake.writes, 5)

    def test_uncertain_absent_write_is_held(self):
        fake, batch = Fake(), record()
        fake.fail_after_write = True
        with self.assertRaises(RuntimeError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        fake.calendar = []
        with self.assertRaisesRegex(RuntimeError, 'uncertain'):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 1)

    def test_incomplete_batch_never_writes(self):
        fake, batch = Fake(), record()
        batch['parts'].pop()
        with self.assertRaises(ValueError):
            studio.schedule_batch(fake, batch, channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 0)

    def test_paid_cost_never_writes(self):
        fake = Fake()
        fake.cost = .1
        with self.assertRaises(ValueError):
            studio.schedule_batch(fake, record(), channels(), lambda r: None, slots())
        self.assertEqual(fake.writes, 0)

    def test_fb_source_comment_and_tiktok_actual_publication_mode(self):
        batch = record()
        facebook = studio.post_item('facebook', channels()['facebook'], batch['parts'][0]['captions']['facebook'], batch['parts'][0]['studioMedia'])
        self.assertEqual(facebook['value'][1]['content'], batch['parts'][0]['captions']['facebook']['sourceUrl'])
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

    def test_schema_change_held_before_creation(self):
        changed = channels()
        changed['youtube']['rules']['settings']['required'] = ['newConsent']
        with self.assertRaisesRegex(ValueError, 'newConsent'):
            studio.schedule_batch(Fake(), record(), changed, lambda r: None, slots())


if __name__ == '__main__':
    unittest.main()
