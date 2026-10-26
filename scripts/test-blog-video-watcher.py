import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('watcher', Path(__file__).with_name('watch-blog-videos.py'))
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)

INDEX = '''<a href="/blog/new-test"><h3>100 New Test MCQs</h3></a>
<a href="/blog/old-test"><h3>100 Old Test MCQs</h3></a>
<a href="/blog/new-test">Duplicate in all articles</a>
<a href="https://example.org/blog/wrong-test">External</a>'''
ARTICLE = '''<link rel="canonical" href="https://www.mcqsbase.com/blog/new-test">
<h1>100 New Test MCQs with Answers and Explanations</h1>
<article><div>Q1 Answer B</div><div><p>What is 1 + 1?</p>
<div class="grid gap-3">
<div><span>A.</span><span>One</span></div>
<div><span>B.</span><span>Two</span></div>
<div><span>C.</span><span>Three</span></div>
<div><span>D.</span><span>Four</span></div>
</div><div><p>Correct Answer</p><p><strong>B) Two</strong></p></div>
<p>EXPLANATION_MUST_NOT_BE_NARRATED</p></div></article>'''


class WatcherTests(unittest.TestCase):
    def test_listing_deduplicates_featured_and_all_articles(self):
        self.assertEqual([a['slug'] for a in watcher.listed_articles(INDEX)], ['new-test', 'old-test'])

    def test_first_run_baselines_older_articles_but_queues_newest(self):
        state = {}
        self.assertEqual(watcher.discover(state, watcher.listed_articles(INDEX)), ['new-test'])
        self.assertEqual(state['articles']['old-test']['status'], 'baseline')
        self.assertEqual(state['articles']['new-test']['status'], 'pending')
        state['articles']['new-test']['status'] = 'ready'
        self.assertEqual(watcher.discover(state, watcher.listed_articles(INDEX)), [])
        next_index = '<a href="/blog/future-test">Future test</a>' + INDEX
        self.assertEqual(watcher.discover(state, watcher.listed_articles(next_index)), ['future-test'])
        self.assertEqual(state['articles']['new-test']['status'], 'ready')

    def test_live_article_extracts_verified_answers_and_omits_explanations(self):
        package = watcher.article_package(ARTICLE, 'new-test')
        self.assertEqual(package['questions'][0]['choices'], ['One', 'Two', 'Three', 'Four'])
        self.assertEqual(package['questions'][0]['correctIndex'], 1)
        self.assertNotIn('EXPLANATION_MUST_NOT_BE_NARRATED', str(package))
        with self.assertRaises(ValueError):
            watcher.article_package(ARTICLE.replace('B) Two', 'B) Three'), 'new-test')
        with self.assertRaises(ValueError):
            watcher.article_package(ARTICLE, 'different-test')

    def test_react_comment_boundaries_do_not_change_option_letters(self):
        rendered = ARTICLE.replace('A.</span>', 'A<!-- -->.</span>').replace('B.</span>', 'B<!-- -->.</span>')
        self.assertEqual(len(watcher.article_package(rendered, 'new-test')['questions']), 1)

    def test_inline_answer_explanation_after_break_is_not_part_of_the_answer(self):
        rendered = ARTICLE.replace('<strong>B) Two</strong>', '<strong>B) Two</strong><br/>This explains the result.')
        package = watcher.article_package(rendered, 'new-test')
        self.assertEqual(package['questions'][0]['correctIndex'], 1)
        self.assertNotIn('This explains', str(package))

    def test_missing_index_does_not_create_a_baseline(self):
        with self.assertRaises(ValueError):
            watcher.listed_articles('<html>Temporary error</html>')

    def test_completed_video_is_not_rendered_a_second_time(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = type('Args', (), {'state_dir': tmp, 'count': 10, 'max_videos': 1})()
            state = {'initializedAt': '2026-10-26', 'articles': {
                'new-test': {'slug': 'new-test', 'url': watcher.BLOG + '/new-test', 'status': 'ready'},
                'old-test': {'slug': 'old-test', 'url': watcher.BLOG + '/old-test', 'status': 'baseline'}}}
            watcher.save_json(Path(tmp) / 'state.json', state)
            with patch.object(watcher, 'fetch_html', return_value=INDEX), patch.object(watcher.subprocess, 'run') as render:
                watcher.run(args)
                render.assert_not_called()

    def test_failed_download_remains_pending_for_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = type('Args', (), {'state_dir': tmp, 'count': 10, 'max_videos': 1})()
            with patch.object(watcher, 'fetch_html', side_effect=[INDEX, TimeoutError('test timeout')]):
                watcher.run(args)
            state = json.loads((Path(tmp) / 'state.json').read_text())
            self.assertEqual(state['articles']['new-test']['status'], 'retry')
            self.assertEqual(state['articles']['old-test']['status'], 'baseline')


if __name__ == '__main__':
    unittest.main()
