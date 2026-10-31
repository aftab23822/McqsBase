import importlib.util
from datetime import datetime
from pathlib import Path
import unittest
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('social', Path(__file__).with_name('quiz-social-policy.py'))
social = importlib.util.module_from_spec(spec)
spec.loader.exec_module(social)


class SocialPolicyTests(unittest.TestCase):
    def test_accounting_hashtags_and_single_question_caption(self):
        copy = social.social_copy('100 Accounting Fundamentals MCQs for NAT-ICOM Preparation', 1,
            'https://www.mcqsbase.com/blog/accounting')
        self.assertIn('1 question.', copy['youtube']['text'])
        self.assertIn('#NATICOM', copy['youtube']['hashtags'])
        self.assertIn('#Accounting', copy['youtube']['hashtags'])
        other_exam = social.hashtags('100 CA Accounting MCQs')
        self.assertIn('#Accounting', other_exam)
        self.assertNotIn('#NATICOM', other_exam)

    def moment(self, day, month=11):
        return datetime(2026, month, day, 10, tzinfo=ZoneInfo('Asia/Karachi'))

    def test_four_campaigns_reserve_sixteen_network_publications(self):
        state = {}
        for day in (1, 8, 15, 22):
            campaign = social.reserve_campaign(state, {'slug': f'quiz-{day}'}, self.moment(day))
            self.assertEqual(len(campaign['networks']), 4)
        self.assertEqual(sum(c['reservedPublications'] for c in state['campaigns']['2026-11'].values()), 16)
        fifth = {'slug': 'quiz-extra'}
        self.assertIsNone(social.reserve_campaign(state, fifth, self.moment(25)))

    def test_only_first_article_in_a_window_is_selected(self):
        state = {}
        social.reserve_campaign(state, {'slug': 'first'}, self.moment(8))
        entry = {'slug': 'second'}
        self.assertIsNone(social.reserve_campaign(state, entry, self.moment(9)))
        self.assertEqual(entry['campaignSelection'], 'archive-only-window-filled')

    def test_partial_campaign_resumes_without_consuming_more_slots(self):
        state, entry = {}, {'slug': 'first'}
        first = social.reserve_campaign(state, entry, self.moment(8))
        first['networks']['facebook'].update(status='scheduled', postId='example-id')
        self.assertEqual(social.reserve_campaign(state, entry, self.moment(9)), first)
        self.assertEqual(len(state['campaigns']['2026-11']), 1)

    def test_scheduled_legacy_article_and_month_end_do_not_create_campaigns(self):
        state = {}
        self.assertIsNone(social.reserve_campaign(state, {'slug': 'legacy', 'publishingStatus': 'scheduled'}, self.moment(8)))
        self.assertIsNone(social.reserve_campaign(state, {'slug': 'month-end'}, self.moment(30)))
        self.assertNotIn('campaigns', state)

    def test_hashtags_match_source_without_unrelated_exam_tags(self):
        tags = social.hashtags('100 NTS NAT-ICS Computer Science MCQs')
        self.assertEqual(len(tags), 5)
        self.assertIn('#ComputerScience', tags)
        self.assertIn('#NATICS', tags)
        self.assertNotIn('#COMSATS', tags)
        self.assertIn('#COMSATS', social.hashtags('100 COMSATS Quantitative Aptitude MCQs'))

    def test_all_platforms_receive_source_url_and_honest_actual_question_count(self):
        url = 'https://www.mcqsbase.com/blog/example'
        copies = social.social_copy('100 Test MCQs', 3, url)
        self.assertEqual(set(copies), {'facebook', 'instagram', 'youtube', 'tiktok'})
        self.assertTrue(all('3 questions.' in copy['text'] and copy['sourceUrl'] == url for copy in copies.values()))
        self.assertEqual(copies['youtube']['format'], 'short')
        self.assertNotIn('first comment', copies['youtube']['text'])


if __name__ == '__main__':
    unittest.main()
