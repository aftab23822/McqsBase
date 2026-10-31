"""Provider-independent validation of source provenance, speech and answer timing."""
import re


def validate_video(manifest, slug, source_title, thinking_seconds=3):
    """Provider-independent checks of the approved source, voice and reveal timing."""
    source_url = 'https://www.mcqsbase.com/blog/' + slug
    proof = manifest.get('productionDeployment') or {}
    if (manifest.get('sourceUrl') != source_url
            or manifest.get('sourceTitle') != source_title
            or not manifest.get('sourceTitle') or not manifest.get('title')
            or manifest.get('sourceVerification') != 'production-deployment'
            or proof.get('environment') != 'Production' or proof.get('state') != 'success'
            or not proof.get('id') or not proof.get('publisherRunId')
            or not re.fullmatch(r'[0-9a-f]{40}', proof.get('sha', ''))
            or not re.fullmatch(r'[0-9a-f]{64}', manifest.get('sourceContentHash') or '')):
        raise ValueError('A selected, ready quiz with verified published source evidence is required.')
    count = manifest.get('count')
    # Campaigns created before this setting was recorded used five seconds.
    # Their published assets retain that format; new reservations snapshot three.
    if (type(count) is not int or not 1 <= count <= 5
            or len(manifest.get('questions', [])) != count
            or manifest.get('width') != 1080 or manifest.get('height') != 1920
            or manifest.get('introIncluded') is not False
            or manifest.get('narration') is not True or manifest.get('answersIncluded') is not True
            or manifest.get('voiceName') != 'Kokoro af_heart'
            or manifest.get('secondsPerQuestion') != thinking_seconds
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
        expected.extend([('narration', number), *[('countdown', number)] * thinking_seconds, ('reveal', number)])
    if stages and stages[-1].get('stage') == 'outro':
        expected.append(('outro', stages[-1].get('question')))
    if [(s.get('stage'), s.get('question')) for s in stages] != expected:
        raise ValueError(f'Answers must follow narration and a complete {thinking_seconds}-second countdown.')
    if any(s['duration'] != 1 for s in stages if s['stage'] == 'countdown'):
        raise ValueError(f'Every thinking countdown must contain {thinking_seconds} full seconds.')
    if elapsed != manifest.get('durationSeconds') or not 0 < elapsed <= 89:
        raise ValueError('The complete video must fit the approved duration limit.')
    return source_url
