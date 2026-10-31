"""Source-specific captions and hashtags shared by all four social channels."""
import json
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / "config/quiz-batch-policy.json").read_text(encoding="utf-8"))


def hashtags(title):
    topic_rules = [
        (r'\bnat[- ]?icom\b', ['NATICOM', 'Accounting']),
        (r'\baccounting\b', ['Accounting', 'AccountingQuiz']),
        (r'\bnat[- ]?ics\b', ['NATICS', 'ComputerScience']),
        (r'(?=.*\bcomsats\b)(?=.*\bquantitative\b)', ['COMSATS', 'QuantitativeAptitude']),
        (r'\bcomputer science\b', ['ComputerScience', 'ComputerQuiz']),
        (r'\bquantitative|\bmathematics|\bmath\b', ['MathQuiz', 'QuantitativeAptitude']),
        (r'\benglish|\bvocabulary|\bgrammar', ['EnglishMCQs', 'Vocabulary']),
        (r'\bmdcat\b', ['MDCAT', 'MedicalEntryTest']),
        (r'\bissb\b', ['ISSB', 'VerbalReasoning']),
        (r'\bnts\b|\bnat\b', ['NTS', 'EntryTest']),
        (r'\bscience\b', ['ScienceQuiz', 'GeneralKnowledge']),
        (r'\bentry test|\baptitude', ['EntryTest', 'TestPreparation']),
    ]
    topics = next((tags for pattern, tags in topic_rules if re.search(pattern, title, re.I)),
                  ['TestPreparation', 'QuizTime'])
    return ['#MCQsBase', '#MCQs', *['#' + tag for tag in topics], '#Shorts']


def social_copy(title, count, source_url):
    tags = hashtags(title)
    noun = 'question' if count == 1 else 'questions'
    common = (f'{title}\n{count} {noun}. Choose A, B, C or D before the timer ends. '
              'Share your score!\n')
    result = {}
    for network in POLICY['channels']:
        cta = ('Full practice set and answers in the first comment.' if network == 'facebook'
               else f'Full practice set: {source_url}\nVisit mcqsbase.com/blog; look for the test title above.')
        result[network] = {
            'title': (f'{title} | {count}-Question Quiz')[:100],
            'text': common + cta + '\n' + ' '.join(tags),
            'hashtags': tags,
            'sourceUrl': source_url,
            'firstCommentText': f'Full practice set and answers: {source_url}',
            'format': 'short' if network == 'youtube' else 'reel' if network in ('facebook', 'instagram') else 'video',
        }
    return result
