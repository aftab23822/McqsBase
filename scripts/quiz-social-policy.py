"""Free-plan campaign reservations and source-specific social copy. No writes to social networks."""
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
import re

ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / 'config/quiz-social-policy.json').read_text(encoding='utf-8'))


def hashtags(title):
    topic_rules = [
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
    common = (f'{title}\n{count} questions. Choose A, B, C or D before the timer ends. '
              'Share your score!\n')
    result = {}
    for network in POLICY['networks']:
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


def publication_window(instant=None):
    current = (instant or datetime.now(ZoneInfo(POLICY['timezone']))).astimezone(ZoneInfo(POLICY['timezone']))
    publication = (current + timedelta(days=1)).replace(hour=20, minute=0, second=0, microsecond=0)
    if publication.month != current.month:
        return None
    return {'month': publication.strftime('%Y-%m'),
            'window': sum(publication.day >= start for start in POLICY['campaignWindowStarts']),
            'scheduledFor': publication.isoformat()}


def reserve_campaign(state, entry, instant=None):
    """Reserve one article per window; repeats resume its existing reservation.

    Reservations consume all four publication slots, including not-yet-written
    networks. A partial campaign never frees capacity for a duplicate campaign.
    Actual Metricool monthly usage must also be reconciled before scheduling.
    """
    if entry.get('campaign'):
        return entry['campaign']
    if entry.get('publishingStatus') in ('scheduled', 'published'):
        return None
    slot = publication_window(instant)
    if not slot:
        entry['campaignSelection'] = 'archive-only-month-end'
        return None
    month, window = slot['month'], slot['window']
    campaigns = state.setdefault('campaigns', {}).setdefault(month, {})
    if str(window) in campaigns or len(campaigns) >= POLICY['monthlyCampaignLimit']:
        entry['campaignSelection'] = 'archive-only-window-filled'
        return None
    if (len(campaigns) + 1) * len(POLICY['networks']) > POLICY['monthlyPublicationBudget']:
        entry['campaignSelection'] = 'archive-only-budget-full'
        return None
    campaign = {'id': f'{month}-{window}', 'slug': entry['slug'], 'month': month,
                'window': window, 'scheduledFor': slot['scheduledFor'],
                'thinkingSeconds': POLICY['thinkingSeconds'],
                'reservedPublications': len(POLICY['networks']),
                'status': 'awaiting-metricool-scheduling',
                'networks': {network: {'status': 'reserved', 'account': identity}
                             for network, identity in POLICY['networks'].items()}}
    campaigns[str(window)] = campaign
    entry['campaign'] = campaign
    entry['campaignSelection'] = 'selected'
    return campaign
