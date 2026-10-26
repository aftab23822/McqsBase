import importlib.util
from datetime import datetime
from pathlib import Path
import unittest
from unittest.mock import patch
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('planner', Path(__file__).with_name('plan-blog-video-campaign.py'))
planner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(planner)
BODY = '| 1 | Test?<br />A) One<br />B) Two<br />C) Three<br />D) Four | **B) Two** |'


class CampaignRenderTests(unittest.TestCase):
    moment = datetime(2026, 11, 10, 10, tzinfo=ZoneInfo('Asia/Karachi'))

    def article(self, slug='new-test', date='2026-11-10', body=BODY):
        return {'slug': slug, 'date': date, 'body': body}

    def test_filled_window_skips_even_source_loading_and_render_setup(self):
        state = {'campaigns': {'2026-11': {'2': {'slug': 'ready-test'}}},
                 'articles': {'ready-test': {'status': 'ready'}}}
        with patch.object(planner.subprocess, 'check_output') as export:
            result = planner.plan_campaign(state, instant=self.moment)
            self.assertFalse(result['generate'])
            export.assert_not_called()

    def test_newest_eligible_article_is_selected_without_rendering_the_others(self):
        articles = [self.article('guide', body='A guide without MCQs'), self.article('newest'), self.article('older')]
        result = planner.plan_campaign({'articles': {}}, articles, self.moment)
        self.assertTrue(result['generate'])
        self.assertEqual(result['slug'], 'newest')

    def test_existing_baseline_and_scheduled_articles_do_not_make_new_videos(self):
        articles = [self.article('scheduled'), self.article('baseline')]
        state = {'articles': {'scheduled': {'status': 'ready', 'publishingStatus': 'scheduled'},
                              'baseline': {'status': 'baseline'}}}
        self.assertFalse(planner.plan_campaign(state, articles, self.moment)['generate'])

    def test_failed_reserved_render_can_retry_without_selecting_another_article(self):
        state = {'campaigns': {'2026-11': {'2': {'slug': 'failed-test'}}},
                 'articles': {'failed-test': {'status': 'retry'}}}
        result = planner.plan_campaign(state, [self.article('newer-test')], self.moment)
        self.assertTrue(result['generate'])
        self.assertEqual(result['slug'], 'failed-test')

    def test_unseen_older_articles_and_unvalidated_answers_are_not_selected(self):
        state = {'initializedAt': '2026-10-26', 'articles': {}}
        articles = [self.article('old-test', date='2026-10-01'),
                    self.article('invalid-test', body=BODY.replace('B) Two**', 'B) Three**'))]
        self.assertFalse(planner.plan_campaign(state, articles, self.moment)['generate'])


if __name__ == '__main__':
    unittest.main()
