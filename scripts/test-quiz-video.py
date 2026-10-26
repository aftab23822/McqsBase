import importlib.util
from pathlib import Path
import unittest
from types import SimpleNamespace
from unittest.mock import patch
import json
import tempfile

spec = importlib.util.spec_from_file_location('quiz_video', Path(__file__).with_name('create-quiz-video.py'))
video = importlib.util.module_from_spec(spec)
spec.loader.exec_module(video)


class QuizContentTests(unittest.TestCase):
    def test_future_voice_jobs_start_at_question_one_without_an_intro(self):
        args = SimpleNamespace(voice=True, voice_engine='windows', include_intro=False, include_outro=False,
                               reveal=True, count=1, seconds=5, voice_name='Test', voice_rate=0)
        question = {'question': 'What is one plus one?', 'choices': ['One', 'Two', 'Three', 'Four'], 'correctIndex': 1}
        with tempfile.TemporaryDirectory() as tmp, patch.object(video.sys, 'platform', 'win32'), patch.object(video.subprocess, 'run'):
            output = Path(tmp)
            video.prepare_voice(args, output, [question], '100 Source MCQs')
            jobs = json.loads((output / 'voice-jobs.json').read_text(encoding='utf-8'))
            self.assertEqual([job['id'] for job in jobs], ['q1', 'a1'])
            self.assertTrue(jobs[0]['text'].startswith('Question 1.'))

    def test_answer_column_cannot_enter_output(self):
        questions = video.extract_questions('| 1 | Test?<br />A) One<br />B) Two<br />C) Three<br />D) Four | **B) Two**<br />SECRET_EXPLANATION |')
        self.assertEqual(questions[0]['choices'], ['One', 'Two', 'Three', 'Four'])
        self.assertNotIn('SECRET_EXPLANATION', str(questions))
        self.assertNotIn('answer', questions[0])

    def test_escaped_pipes_stay_in_question_column(self):
        questions = video.extract_questions(r'| 1 | What does A\|B mean?<br />A) One<br />B) Two<br />C) Three<br />D) Four | SECRET |')
        self.assertEqual(questions[0]['question'], 'What does A|B mean?')

    def test_invalid_and_duplicate_questions_are_excluded(self):
        valid = '| 1 | Test?<br />A) One<br />B) Two<br />C) Three<br />D) Four | SECRET |'
        invalid = '| 2 | Bad?<br />A) One<br />B) Two<br />D) Three<br />C) Four | SECRET |'
        self.assertEqual(len(video.extract_questions('\n'.join([valid, valid, invalid]))), 1)

    def test_real_article_supports_both_sizes_without_repeats(self):
        article = video.ROOT / 'public/blog/university-of-sindh-entry-test-mcqs/article.md'
        questions = video.extract_questions(article.read_text(encoding='utf-8'))
        self.assertEqual(len(questions), 100)
        for count in (10, 20):
            chosen = video.select_questions(questions, count, 'test')
            self.assertEqual(len({q['key'] for q in chosen}), count)

    def test_reveals_require_an_answer_matching_the_selected_option(self):
        valid = '| 1 | Test?<br />A) One<br />B) Two<br />C) Three<br />D) Four | **B) Two**<br />SECRET_EXPLANATION |'
        questions = video.extract_questions(valid, include_answers=True)
        self.assertEqual(questions[0]['correctIndex'], 1)
        self.assertNotIn('SECRET_EXPLANATION', str(questions))
        self.assertEqual(video.extract_questions(valid.replace('**B) Two**', '**B) Three**'), True), [])
        self.assertEqual(video.extract_questions(valid.replace('**B) Two**', 'Unknown'), True), [])

    def test_title_comes_from_the_actual_source_and_keeps_full_set_count(self):
        full_title, display_title = video.article_titles('university-of-sindh-entry-test-mcqs')
        self.assertEqual(display_title, '100 University of Sindh Entry Test MCQs')
        self.assertIn(display_title, full_title)
        with self.assertRaises(ValueError):
            video.article_titles('comsats-not-registered')

    def test_all_selected_reveal_answers_are_consistent_with_the_article(self):
        article = video.ROOT / 'public/blog/university-of-sindh-entry-test-mcqs/article.md'
        questions = video.extract_questions(article.read_text(encoding='utf-8'), include_answers=True)
        self.assertEqual(len(questions), 100)
        self.assertTrue(all(0 <= question['correctIndex'] < 4 for question in questions))

    def test_narration_speaks_math_and_binary_notation_explicitly(self):
        self.assertEqual(video.spoken_text('3/4 × 2² = 3'), '3 over 4 times 2 squared equals 3')
        self.assertEqual(video.spoken_text('binary number 101101'), 'binary number 1 0 1 1 0 1')
        self.assertEqual(video.spoken_text('2 GHz and O(n log n)'), '2 gigahertz and big O of n log n')

    def test_duration_budget_keeps_complete_questions_and_five_second_thinking(self):
        args = SimpleNamespace(include_intro=False, include_outro=True, voice=True,
                               seconds=5, reveal=True, reveal_seconds=3, max_duration=89)
        voices = {'outro': 'outro', **{f'{kind}{n}': kind for n in range(1, 6) for kind in ('q', 'a')}}
        # Every question costs 13 speech + 5 thinking + 4 reveal = 22 sec.
        # Three plus a five-second outro fit; four do not. No speech is cut.
        with patch.object(video, 'clip_duration', side_effect=lambda p: {'q': 12, 'a': 3, 'outro': 4}[p]):
            self.assertEqual(video.fit_question_count([{}] * 5, voices, args), 3)
        args.max_duration = 2
        with patch.object(video, 'clip_duration', return_value=10):
            self.assertEqual(video.fit_question_count([{}], voices, args), 0)


if __name__ == '__main__':
    unittest.main()
