"""Validate a selected cloud quiz and build Metricool requests. No network writes."""
from datetime import datetime
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('quiz_social_policy', ROOT / 'scripts/quiz-social-policy.py')
social = importlib.util.module_from_spec(spec)
spec.loader.exec_module(social)


def validate_package(entry, manifest):
    """Fail closed for samples, altered provenance, or an early answer reveal."""
    source_url = 'https://www.mcqsbase.com/blog/' + entry['slug']
    proof = manifest.get('productionDeployment') or {}
    if (entry.get('status') != 'ready' or not entry.get('campaign')
            or manifest.get('sourceUrl') != source_url
            or manifest.get('sourceTitle') != entry.get('sourceTitle')
            or not manifest.get('sourceTitle') or not manifest.get('title')
            or manifest.get('sourceVerification') != 'production-deployment'
            or proof.get('environment') != 'Production' or proof.get('state') != 'success'
            or not proof.get('id') or not proof.get('publisherRunId')
            or not re.fullmatch(r'[0-9a-f]{40}', proof.get('sha', ''))
            or not re.fullmatch(r'[0-9a-f]{64}', manifest.get('sourceContentHash') or '')):
        raise ValueError('A selected, ready quiz with verified published source evidence is required.')
    count = manifest.get('count')
    if (type(count) is not int or not 1 <= count <= social.POLICY['questionLimit']
            or len(manifest.get('questions', [])) != count
            or manifest.get('width') != 1080 or manifest.get('height') != 1920
            or manifest.get('introIncluded') is not False
            or manifest.get('narration') is not True or manifest.get('answersIncluded') is not True
            or manifest.get('voiceName') != 'Kokoro af_heart'
            or manifest.get('secondsPerQuestion') != 5
            or manifest.get('countdownStartsAfterNarration') is not True):
        raise ValueError('The quiz does not match the approved Shorts format.')
    for question in manifest['questions']:
        choices = question.get('choices', [])
        answer = question.get('correctIndex')
        if (not question.get('question') or len(choices) != 4 or not all(choices)
                or type(answer) is not int or not 0 <= answer < 4):
            raise ValueError('A question or its validated correct option is missing.')
    stages = manifest.get('stages', [])
    elapsed = 0
    for stage in stages:
        if stage.get('start') != elapsed or stage.get('duration', 0) <= 0:
            raise ValueError('The video timeline has a gap, overlap or invalid duration.')
        elapsed += stage['duration']
    expected = []
    for number in range(1, count + 1):
        expected.extend([('narration', number), *[('countdown', number)] * 5, ('reveal', number)])
    if stages and stages[-1].get('stage') == 'outro':
        expected.append(('outro', stages[-1].get('question')))
    if [(s.get('stage'), s.get('question')) for s in stages] != expected:
        raise ValueError('Answers must follow narration and a complete five-second countdown.')
    if any(s['duration'] != 1 for s in stages if s['stage'] == 'countdown'):
        raise ValueError('Every thinking countdown must contain five full seconds.')
    if elapsed != manifest.get('durationSeconds') or not 0 < elapsed <= social.POLICY['maxDurationSeconds']:
        raise ValueError('The complete video must fit the approved duration limit.')
    return source_url


def build_requests(state, entry, manifest, media_url, repository, instant=None):
    """Build missing network requests only after the central reservation is checked.

    The caller must separately reconcile live account identities, monthly usage and
    existing Metricool posts before sending any request. An uncertain write is held.
    """
    source_url = validate_package(entry, manifest)
    campaign = entry['campaign']
    month, window = campaign['month'], str(campaign['window'])
    campaigns = state.get('campaigns', {}).get(month, {})
    if campaigns.get(window) != campaign or campaign.get('slug') != entry['slug']:
        raise ValueError('The article and authoritative campaign ledger disagree.')
    if (len(campaigns) > social.POLICY['monthlyCampaignLimit']
            or sum(c.get('reservedPublications', 0) for c in campaigns.values()) > social.POLICY['monthlyPublicationBudget']
            or campaign.get('reservedPublications') != 4
            or set(campaign.get('networks', {})) != set(social.POLICY['networks'])):
        raise ValueError('The campaign ledger exceeds the free-plan publication budget.')
    publication = datetime.fromisoformat(campaign['scheduledFor']).astimezone(ZoneInfo(social.POLICY['timezone']))
    current = instant or datetime.now(ZoneInfo(social.POLICY['timezone']))
    actual_window = sum(publication.day >= start for start in social.POLICY['campaignWindowStarts'])
    if publication <= current or publication.strftime('%Y-%m') != month or str(actual_window) != window:
        raise ValueError('The reserved date must be future and inside the same campaign month and window.')
    media = urlsplit(media_url)
    prefix = '/' + repository + '/releases/download/mcqsbase-quiz-media/'
    if (media.scheme != 'https' or media.netloc != 'github.com' or media.query or media.fragment
            or not media.path.startswith(prefix)
            or not re.fullmatch(r'[a-z0-9-]+-[0-9a-f]{16}\.mp4', media.path[len(prefix):])):
        raise ValueError('Use an immutable public MP4 from the quiz media release.')
    captions = social.social_copy(manifest['title'], manifest['count'], source_url)
    result = {}
    for network, identity in social.POLICY['networks'].items():
        receipt = campaign['networks'][network]
        if receipt.get('account') != identity:
            raise ValueError('A reserved social account does not match the approved identity.')
        if receipt.get('status') in ('scheduled', 'published'):
            if not receipt.get('postId') or not receipt.get('uuid'):
                raise ValueError('A completed publication is missing its receipt; reconcile it first.')
            continue
        if receipt.get('status') != 'reserved':
            raise ValueError('An in-progress or uncertain write requires reconciliation before scheduling.')
        caption = captions[network]
        info = {'autoPublish': True, 'draft': False, 'media': [media_url],
                'providers': [{'network': network}], 'text': caption['text'],
                'publicationDate': {'dateTime': publication.strftime('%Y-%m-%dT%H:%M:%S'),
                                    'timezone': social.POLICY['timezone']}}
        if network == 'facebook':
            info.update(facebookData={'type': 'REEL', 'title': caption['title']},
                        firstCommentText=caption['firstCommentText'])
        elif network == 'instagram':
            info['instagramData'] = {'type': 'REEL', 'showReelOnFeed': True, 'isAiGenerated': True}
        elif network == 'youtube':
            info['youtubeData'] = {'type': 'short', 'title': caption['title'], 'privacy': 'public',
                                   'category': 'EDUCATION', 'madeForKids': False,
                                   'isAiGeneratedContent': True,
                                   'tags': [tag.lstrip('#') for tag in caption['hashtags']]}
        else:
            info['tiktokData'] = {'title': caption['title'], 'privacyOption': 'PUBLIC_TO_EVERYONE', 'isAigc': True}
        result[network] = {'blogId': social.POLICY['metricoolBrandId'], 'date': publication.isoformat(),
                           'info': json.dumps(info, ensure_ascii=False)}
    return result
