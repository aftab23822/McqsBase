"""Publication boundary tests; no live account writes or test-video uploads."""
from copy import deepcopy
from datetime import datetime
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('metricool_payload', ROOT / 'scripts/metricool-campaign-payload.py')
payload = importlib.util.module_from_spec(spec)
spec.loader.exec_module(payload)


class PublicationBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.entry = {'slug': 'new-entry-test', 'status': 'ready', 'sourceTitle': '100 Entry Test MCQs'}
        self.state = {'articles': {self.entry['slug']: self.entry}}
        self.instant = datetime.fromisoformat('2026-11-01T12:00:00+05:00')
        payload.social.reserve_campaign(self.state, self.entry, self.instant)
        stages, elapsed = [], 0
        for name, duration in [('narration', 10), *[('countdown', 1)] * 3, ('reveal', 3)]:
            stages.append({'stage': name, 'question': 1, 'start': elapsed, 'duration': duration})
            elapsed += duration
        self.manifest = {
            'sourceUrl': 'https://www.mcqsbase.com/blog/new-entry-test',
            'sourceTitle': self.entry['sourceTitle'], 'title': self.entry['sourceTitle'],
            'sourceVerification': 'production-deployment', 'sourceContentHash': 'b' * 64,
            'productionDeployment': {'id': 9, 'publisherRunId': 2, 'sha': 'a' * 40,
                                     'environment': 'Production', 'state': 'success'},
            'count': 1, 'width': 1080, 'height': 1920, 'durationSeconds': elapsed,
            'introIncluded': False, 'narration': True, 'answersIncluded': True,
            'voiceName': 'Kokoro af_heart', 'secondsPerQuestion': 3,
            'countdownStartsAfterNarration': True, 'stages': stages,
            'questions': [{'question': 'Test?', 'choices': ['A', 'B', 'C', 'D'], 'correctIndex': 2}],
        }
        self.url = ('https://github.com/aftab23822/McqsBase/releases/download/'
                    'mcqsbase-quiz-media/new-entry-test-0123456789abcdef.mp4')

    def build(self):
        return payload.build_requests(self.state, self.entry, self.manifest, self.url,
                                      'aftab23822/McqsBase', self.instant)

    def test_four_requests_keep_source_hashtags_and_network_formats(self):
        requests = self.build()
        self.assertEqual(set(requests), {'facebook', 'instagram', 'youtube', 'tiktok'})
        for network, request in requests.items():
            info = json.loads(request['info'])
            self.assertTrue(info['autoPublish'])
            self.assertFalse(info['draft'])
            self.assertEqual(info['providers'], [{'network': network}])
            self.assertEqual(info['media'], [self.url])
            self.assertIn('#MCQsBase', info['text'])
            self.assertIn('1 questions.', info['text'])
            if network == 'facebook':
                self.assertIn(self.manifest['sourceUrl'], info['firstCommentText'])
                self.assertEqual(info['facebookData']['type'], 'REEL')
            else:
                self.assertIn(self.manifest['sourceUrl'], info['text'])
                self.assertNotIn('firstCommentText', info)
        self.assertEqual(json.loads(requests['youtube']['info'])['youtubeData']['type'], 'short')

    def test_smoke_preview_cannot_be_published(self):
        self.manifest['sourceVerification'] = None
        self.manifest['productionDeployment'] = None
        with self.assertRaisesRegex(ValueError, 'verified published source'):
            self.build()

    def test_early_reveal_and_short_countdown_rejected(self):
        self.manifest['stages'][2]['stage'] = 'reveal'
        with self.assertRaisesRegex(ValueError, 'complete 3-second'):
            self.build()

    def test_legacy_five_second_campaign_can_still_be_verified(self):
        self.entry['campaign'].pop('thinkingSeconds')
        self.manifest['secondsPerQuestion'] = 5
        self.manifest['stages'] = [
            {'stage': name, 'question': 1, 'start': start, 'duration': duration}
            for name, start, duration in [('narration', 0, 10),
                *[('countdown', second, 1) for second in range(10, 15)], ('reveal', 15, 3)]]
        self.manifest['durationSeconds'] = 18
        self.assertEqual(len(self.build()), 4)

    def test_oversized_video_rejected(self):
        self.manifest['stages'][-1]['duration'] += 90
        self.manifest['durationSeconds'] += 90
        with self.assertRaisesRegex(ValueError, 'duration limit'):
            self.build()

    def test_partial_campaign_resumes_only_missing_networks(self):
        self.entry['campaign']['networks']['facebook'].update(status='scheduled', postId=123, uuid='abc')
        self.assertNotIn('facebook', self.build())
        self.entry['campaign']['networks']['instagram']['status'] = 'uncertain'
        with self.assertRaisesRegex(ValueError, 'reconciliation'):
            self.build()

    def test_disagreeing_or_over_budget_ledger_rejected(self):
        self.state['campaigns']['2026-11']['1'] = deepcopy(self.entry['campaign'])
        self.entry['campaign']['slug'] = 'different-article'
        with self.assertRaisesRegex(ValueError, 'ledger disagree'):
            self.build()

    def test_expired_date_or_changed_identity_is_held(self):
        self.instant = datetime.fromisoformat('2026-11-03T12:00:00+05:00')
        with self.assertRaisesRegex(ValueError, 'reserved date'):
            self.build()
        self.instant = datetime.fromisoformat('2026-11-01T12:00:00+05:00')
        self.entry['campaign']['networks']['facebook']['account'] = 'wrong-page'
        with self.assertRaisesRegex(ValueError, 'approved identity'):
            self.build()

    def test_arbitrary_or_authenticated_media_urls_rejected(self):
        self.url += '?token=do-not-transmit'
        with self.assertRaisesRegex(ValueError, 'immutable public MP4'):
            self.build()


if __name__ == '__main__':
    unittest.main()
