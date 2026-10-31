import importlib.util
from datetime import datetime
from pathlib import Path
import unittest
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('social', Path(__file__).with_name('quiz-social-copy.py'))
social = importlib.util.module_from_spec(spec)
spec.loader.exec_module(social)


class SocialCopyTests(unittest.TestCase):
    def test_accounting_hashtags_and_single_question_caption(self):
        copy = social.social_copy('100 Accounting Fundamentals MCQs for NAT-ICOM Preparation', 1,
            'https://www.mcqsbase.com/blog/accounting')
        self.assertIn('1 question.', copy['youtube']['text'])
        self.assertIn('#NATICOM', copy['youtube']['hashtags'])
        self.assertIn('#Accounting', copy['youtube']['hashtags'])
        other_exam = social.hashtags('100 CA Accounting MCQs')
        self.assertIn('#Accounting', other_exam)
        self.assertNotIn('#NATICOM', other_exam)

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
