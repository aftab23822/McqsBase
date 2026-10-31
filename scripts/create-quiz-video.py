"""Render an MCQsBase quiz using local article text, Pillow and FFmpeg.

No paid service, AI API, watermark, or publishing side effect.
"""
import argparse
import hashlib
import html
import importlib.util
import json
import math
from pathlib import Path
import random
import re
import shutil
import subprocess
import sys
import wave
from array import array

ROOT = Path(__file__).resolve().parents[1]
policy_spec = importlib.util.spec_from_file_location('quiz_social_policy', ROOT / 'scripts/quiz-social-policy.py')
social = importlib.util.module_from_spec(policy_spec)
policy_spec.loader.exec_module(social)
LOCAL_PACKAGES = ROOT / '.social-automation' / 'python'
if LOCAL_PACKAGES.exists():
    sys.path.insert(0, str(LOCAL_PACKAGES))


def plain_text(value):
    value = html.unescape(re.sub(r'<[^>]+>', '', value))
    value = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', value)
    return re.sub(r'\s+', ' ', value.replace('**', '').replace('`', '').replace('\\|', '|')).strip()


def extract_questions(body, include_answers=False):
    """Only use a validated answer key when a timed reveal is requested."""
    result, seen = [], set()
    for line in body.splitlines():
        if not re.match(r'^\|\s*\d+\s*\|', line):
            continue
        cells = re.split(r'(?<!\\)\|', line)
        if len(cells) < 5:
            continue
        parts = re.split(r'<br\s*/?\s*>', cells[2], flags=re.I)
        if len(parts) != 5:
            continue
        question = plain_text(parts[0])
        choices = []
        for label, part in zip('ABCD', parts[1:]):
            match = re.fullmatch(r'\s*' + label + r'\)\s*(.+)', plain_text(part))
            if not match:
                break
            choices.append(match.group(1))
        key = hashlib.sha256(question.casefold().encode()).hexdigest()
        if question and len(choices) == 4 and len(set(choices)) == 4 and key not in seen:
            item = {'question': question, 'choices': choices, 'key': key, 'sourceNumber': int(cells[1].strip())}
            if include_answers:
                answer = plain_text(re.split(r'<br\s*/?\s*>', cells[3], flags=re.I)[0])
                match = re.fullmatch(r'([A-D])\)\s*(.+)', answer)
                if not match:
                    continue
                answer_index = 'ABCD'.index(match.group(1))
                if match.group(2).casefold() != choices[answer_index].casefold():
                    continue
                item['correctIndex'] = answer_index
            result.append(item)
            seen.add(key)
    return result


def select_questions(questions, count, seed):
    # Prefer concise questions; narration provides separate listening time.
    eligible = [q for q in questions if len(q['question'].split()) <= 17
                and all(len(option.split()) <= 7 for option in q['choices'])]
    if len(eligible) < count:
        eligible = [q for q in questions if len(q['question'].split()) <= 45
                    and all(len(option.split()) <= 18 for option in q['choices'])]
    if len(eligible) < count:
        raise ValueError(f'Only {len(eligible)} short questions found; need {count}.')
    return random.Random(seed).sample(eligible, count)


def ordered_questions(questions, start, count):
    """Use consecutive source rows, never silently skip an invalid source MCQ."""
    if type(start) is not int or start < 1 or count < 1:
        raise ValueError('Ordered selection requires a positive starting question and count.')
    numbers = [q.get('sourceNumber') for q in questions]
    if any(type(n) is not int or n < 1 for n in numbers) or len(numbers) != len(set(numbers)):
        raise ValueError('Ordered selection requires unique original source question numbers.')
    indexed = dict(zip(numbers, questions))
    expected = list(range(start, start + count))
    if not all(number in indexed for number in expected):
        raise ValueError('A required consecutive source question is invalid or missing; do not skip it.')
    return [indexed[number] for number in expected]


def question_number(args, item, local_index):
    return item['sourceNumber'] if getattr(args, 'selection', 'random') == 'ordered' else local_index


def find_font(explicit=None, bold=False):
    candidates = [explicit] if explicit else []
    candidates += ([r'C:\Windows\Fonts\segoeuib.ttf',
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if bold else
                   [r'C:\Windows\Fonts\segoeui.ttf',
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'])
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    raise RuntimeError('No usable font found. Pass --font and --bold-font.')


def find_ffmpeg(explicit=None):
    if explicit:
        return explicit
    executable = shutil.which('ffmpeg')
    if executable:
        return executable
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise RuntimeError('Install FFmpeg or imageio-ffmpeg; see docs/quiz-video-automation.md.') from exc


def article_titles(slug, override=None):
    registry = (ROOT / 'src/data/importedBlogArticles.js').read_text(encoding='utf-8')
    match = re.search(r'"' + re.escape(slug) + r'"\s*:\s*\{\s*title:\s*("(?:\\.|[^"\\])*")', registry)
    if not match:
        raise ValueError(f'No registered article title found for {slug}.')
    source_title = json.loads(match.group(1))
    display_title = override or re.sub(r'\s+with Answers\b.*$', '', source_title, flags=re.I)
    return source_title, display_title


def spoken_text(text):
    text = re.sub(r'\bMCQs\b', 'multiple choice questions', text, flags=re.I).replace('_', ' blank ')
    text = re.sub(r'(\bbinary(?: number)?\s+)([01]{2,})',
                  lambda match: match.group(1) + ' '.join(match.group(2)), text, flags=re.I)
    text = re.sub(r'\bGHz\b', 'gigahertz', text)
    text = re.sub(r'\bO\(([^)]+)\)', r'big O of \1', text)
    for symbol, words in {'×': ' times ', '÷': ' divided by ', '−': ' minus ',
                          '²': ' squared ', '³': ' cubed ', '⁴': ' to the fourth power ',
                          '√': ' square root of ', 'π': ' pi ', '%': ' percent ',
                          '+': ' plus ', '=': ' equals '}.items():
        text = text.replace(symbol, words)
    text = re.sub(r'(?<=\d)\s*/\s*(?=\d)', ' over ', text)
    text = re.sub(r'(?<=\d):(?=\d)', ' to ', text)
    return re.sub(r'\s+', ' ', text).strip()


def load_article_package(filename):
    package = json.loads(Path(filename).read_text(encoding='utf-8'))
    slug, title = package.get('slug', ''), package.get('title', '')
    expected_url = f'https://www.mcqsbase.com/blog/{slug}'
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or not isinstance(title, str) or not title.strip():
        raise ValueError('The article package has an invalid slug or title.')
    if package.get('url') != expected_url:
        raise ValueError('The source URL must match the canonical MCQsBase article URL.')
    questions, seen = [], set()
    for ordinal, item in enumerate(package.get('questions', []), 1):
        question, choices, correct = item.get('question'), item.get('choices'), item.get('correctIndex')
        if (not isinstance(question, str) or not question.strip() or not isinstance(choices, list)
                or len(choices) != 4 or any(not isinstance(c, str) or not c.strip() for c in choices)
                or len(set(choices)) != 4 or type(correct) is not int or correct not in range(4)):
            raise ValueError('The article package contains an invalid question or answer.')
        key = hashlib.sha256(question.casefold().encode()).hexdigest()
        if key not in seen:
            source_number = item.get('sourceNumber', ordinal)
            if type(source_number) is not int or source_number < 1:
                raise ValueError('Invalid original source question number.')
            questions.append({'question': question, 'choices': choices, 'correctIndex': correct,
                              'key': key, 'sourceNumber': source_number})
            seen.add(key)
    return package, questions


def prepare_voice(args, output, selected, display_title):
    if not args.voice:
        return {}
    if args.voice_engine == 'windows' and sys.platform != 'win32':
        raise RuntimeError('The current offline voice uses Windows speech. Use --no-voice on other systems.')
    voice_dir = output / 'voice'
    voice_dir.mkdir(exist_ok=True)
    jobs = []
    if args.include_intro:
        jobs.append({'id': 'intro', 'text': f'{spoken_text(display_title)}. Try {args.count} questions from this practice set. '
                     f'Listen to each question, then you have {args.seconds} seconds to choose your answer.'})
    for index, item in enumerate(selected, 1):
        choices = ' '.join(f'Option {label}. {spoken_text(choice)}.' for label, choice in zip('ABCD', item['choices']))
        jobs.append({'id': f'q{index}', 'text': f'Question {question_number(args, item, index)}. {spoken_text(item["question"])} {choices}'})
        if args.reveal:
            correct = item['correctIndex']
            jobs.append({'id': f'a{index}', 'text': f'The correct answer is option {"ABCD"[correct]}. '
                         f'{spoken_text(item["choices"][correct])}.'})
    if args.include_outro:
        jobs.append({'id': 'outro', 'text': 'Share your score. Practise more at M C Qs Base dot com.'})
    for job in jobs:
        job['output'] = str(voice_dir / f'{job["id"]}.wav')
    job_path = output / 'voice-jobs.json'
    job_path.write_text(json.dumps(jobs, ensure_ascii=False), encoding='utf-8')
    if args.voice_engine == 'kokoro':
        if not args.kokoro_model or not args.kokoro_voices:
            raise ValueError('Kokoro requires --kokoro-model and --kokoro-voices.')
        import soundfile as sf
        import onnxruntime as ort
        from kokoro_onnx import Kokoro
        ort.set_default_logger_severity(3)
        voice = Kokoro(args.kokoro_model, args.kokoro_voices)
        for job in jobs:
            raw = voice_dir / f'{job["id"]}-raw.wav'
            samples, sample_rate = voice.create(job['text'], voice=args.kokoro_voice, speed=.96, lang='en-us')
            sf.write(str(raw), samples, sample_rate, subtype='PCM_16')
            subprocess.run([find_ffmpeg(args.ffmpeg), '-v', 'error', '-y', '-i', str(raw),
                            '-af', 'highpass=f=65,loudnorm=I=-17:TP=-1.5:LRA=9',
                            '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', job['output']], check=True)
        args.voice_name = 'Kokoro ' + args.kokoro_voice
    else:
        subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-File',
                        str(ROOT / 'scripts/synthesize-quiz-voice.ps1'), '-JobsPath', str(job_path),
                        '-Voice', args.voice_name, '-Rate', str(args.voice_rate)], check=True)
    return {job['id']: Path(job['output']) for job in jobs}


def clip_duration(path):
    if path is None:
        return 0
    with wave.open(str(path), 'rb') as wav:
        return wav.getnframes() / wav.getframerate()


def fit_question_count(selected, voices, args):
    """Fit whole question/reveal pairs; never truncate speech or thinking time."""
    def stage(audio, minimum=1):
        return max(minimum, math.ceil(clip_duration(voices.get(audio)) + .5))
    fixed = (stage('intro', 5) if args.include_intro else 0) + (stage('outro', 5) if args.include_outro else 0)
    total = fixed
    for index, _ in enumerate(selected, 1):
        cost = (stage(f'q{index}') if args.voice else 0) + args.seconds
        if args.reveal:
            cost += stage(f'a{index}', args.reveal_seconds)
        if args.max_duration and total + cost > args.max_duration:
            return index - 1
        total += cost
    return len(selected)


def write_audio(timeline, output):
    sample_rate = 48000
    with wave.open(str(output), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for segment in timeline:
            samples = array('h', [0]) * (sample_rate * segment['duration'])
            audio = segment.get('audio')
            if audio:
                with wave.open(str(audio), 'rb') as clip:
                    if (clip.getframerate(), clip.getnchannels(), clip.getsampwidth()) != (48000, 1, 2):
                        raise ValueError('Voice audio must be 48 kHz, mono, 16-bit PCM.')
                    speech = array('h')
                    speech.frombytes(clip.readframes(clip.getnframes()))
                offset = int(.30 * sample_rate) if segment['stage'] == 'reveal' else 0
                if len(speech) + offset > len(samples):
                    raise ValueError('Speech would be cut off by the video timeline.')
                samples[offset:offset + len(speech)] = speech
            if segment.get('tone'):
                # Original countdown clicks or a soft two-note correct-answer chime.
                chime = segment['tone'] == 'chime'
                for i in range(int(sample_rate * (.24 if chime else .09))):
                    t = i / sample_rate
                    frequency = (660 if t < .12 else 880) if chime else 740
                    amplitude = int(1900 * math.sin(2 * math.pi * frequency * t) *
                                    max(0, 1 - (t % .12) / .12))
                    samples[i] = max(-32768, min(32767, samples[i] + amplitude))
            wav.writeframes(samples.tobytes())


def create_video(args):
    from PIL import Image, ImageDraw, ImageFont
    package = None
    if args.article_json:
        package, questions = load_article_package(args.article_json)
        args.slug = package['slug']
        source_title = package['title']
        display_title = args.title or re.sub(r'\s+with Answers\b.*$', '', source_title, flags=re.I)
    else:
        source = ROOT / 'public' / 'blog' / args.slug / 'article.md'
        source_title, display_title = article_titles(args.slug, args.title)
        questions = extract_questions(source.read_text(encoding='utf-8'), args.reveal)
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.slug):
        raise ValueError('Use an article slug containing lowercase letters, numbers and hyphens.')
    ordered = getattr(args, 'selection', 'random') == 'ordered'
    selected = (ordered_questions(questions, args.start_question, args.count) if ordered
                else select_questions(questions, args.count, args.seed))
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    frames_dir = output / 'frames'
    frames_dir.mkdir(exist_ok=True)
    voices = prepare_voice(args, output, selected, display_title)
    requested_count = args.count
    selected = selected[:fit_question_count(selected, voices, args)]
    if not selected:
        raise ValueError('No complete narrated question fits the short-video duration limit.')
    args.count = len(selected)
    normal, bold = find_font(args.font), find_font(args.bold_font, bold=True)
    navy, muted, white, gold, cyan = '#0B1425', '#AEBBD0', '#F4F6FA', '#F4C568', '#5BDED3'
    base = Image.new('RGB', (1080, 1920), navy)
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((50, 195, 1030, 1740), radius=44, fill='#132139')
    draw.rounded_rectangle((70, 100, 132, 162), radius=15, fill=gold)
    for x in (87, 108):
        for y in (117, 138):
            draw.rectangle((x, y, x + 8, y + 8), fill=navy)
    draw.text((154, 97), 'MCQsBase', font=ImageFont.truetype(bold, 50), fill=white)
    draw.text((72, 1794), 'www.mcqsbase.com', font=ImageFont.truetype(normal, 31), fill=muted)

    def text_block(image, text, box, size=64, minimum=28, color=white, heavy=False):
        painter = ImageDraw.Draw(image)
        x0, y0, x1, y1 = box
        for current_size in range(size, minimum - 1, -2):
            font = ImageFont.truetype(bold if heavy else normal, current_size)
            lines = []
            for paragraph in text.split('\n'):
                line = ''
                for word in paragraph.split():
                    trial = f'{line} {word}'.strip()
                    if painter.textlength(trial, font=font) > x1 - x0:
                        if not line or painter.textlength(word, font=font) > x1 - x0:
                            raise ValueError('Unbreakable word is too wide for the video.')
                        lines.append(line)
                        line = word
                    else:
                        line = trial
                lines.append(line)
            line_height = round(current_size * 1.32)
            if len(lines) * line_height <= y1 - y0:
                for i, line in enumerate(lines):
                    painter.text((x0, y0 + i * line_height), line, font=font, fill=color)
                return
        raise ValueError(f'Text does not fit safely: {text}')

    timeline = []

    def save_frame(image, duration, stage, question=None, audio=None, tone=None):
        filename = frames_dir / f'{len(timeline):04d}.png'
        image.save(filename)
        timeline.append({'frame': filename, 'duration': duration, 'stage': stage,
                         'question': question, 'audio': audio, 'tone': tone})

    def stage_duration(audio_id, minimum=1):
        return max(minimum, math.ceil(clip_duration(voices.get(audio_id)) + .5))

    def check_mark(image, x, y, color=cyan, size=32):
        ImageDraw.Draw(image).line([(x, y + size * .55), (x + size * .35, y + size * .9),
                                   (x + size, y)], fill=color, width=8, joint='curve')

    def question_card(item, index, reveal=False):
        card = base.copy()
        text_block(card, display_title, (92, 240, 976, 384), 47, minimum=28, color=gold, heavy=True)
        counter = (f'QUESTION {question_number(args, item, index):02d} · PART {args.batch_part}/{args.batch_size}'
                   if ordered else f'QUESTION {index:02d} / {args.count:02d}')
        text_block(card, counter, (92, 402, 780, 467), 33, color=muted, heavy=True)
        text_block(card, item['question'], (92, 520, 976, 790), 66, heavy=True)
        painter = ImageDraw.Draw(card)
        for i, option in enumerate(item['choices']):
            top = 825 + i * 160
            correct = reveal and i == item['correctIndex']
            painter.rounded_rectangle((88, top, 992, top + 140), radius=23,
                                      fill='#16483F' if correct else '#1B2F4B',
                                      outline=cyan if correct else '#344862', width=4 if correct else 2)
            painter.rounded_rectangle((108, top + 30, 184, top + 108), radius=17,
                                      fill=cyan if correct else '#29415E')
            text_block(card, 'ABCD'[i], (128, top + 42, 175, top + 106), 38, color=navy if correct else white, heavy=True)
            text_block(card, option, (215, top + 25, 900, top + 126), 43)
            if correct:
                check_mark(card, 930, top + 54)
        text_block(card, 'Full practice set: mcqsbase.com/blog', (92, 1640, 980, 1720), 32, color=gold)
        return card

    intro = base.copy()
    text_block(intro, 'FROM THE FULL PRACTICE SET', (92, 275, 980, 350), 32, color=cyan, heavy=True)
    text_block(intro, display_title, (92, 420, 970, 830), 82, color=gold, heavy=True)
    text_block(intro, f'{args.count} questions in this video.\nHow many can you solve?', (92, 920, 970, 1120), 51)
    text_block(intro, f'Listen. Choose. Check.\n{args.seconds} seconds to think after each question.',
               (92, 1260, 970, 1450), 39, color=muted)
    text_block(intro, 'Full set + answers in the comments', (92, 1540, 970, 1650), 34, color=gold)
    if args.include_intro:
        save_frame(intro, stage_duration('intro', 5), 'intro', audio=voices.get('intro'))

    for index, item in enumerate(selected, 1):
        card = question_card(item, index)
        if args.voice:
            listening = card.copy()
            text_block(listening, 'LISTEN TO THE QUESTION', (92, 1520, 980, 1600), 31, color=muted, heavy=True)
            save_frame(listening, stage_duration(f'q{index}'), 'narration', index, voices.get(f'q{index}'))
        for remaining in range(args.seconds, 0, -1):
            frame = card.copy()
            painter = ImageDraw.Draw(frame)
            painter.ellipse((888, 391, 984, 487), outline=gold, width=4)
            font = ImageFont.truetype(bold, 42)
            value = str(remaining)
            painter.text((936 - painter.textlength(value, font=font) / 2, 407), value, font=font, fill=gold)
            painter.rounded_rectangle((92, 1520, 984, 1532), radius=6, fill='#29415E')
            painter.rounded_rectangle((92, 1520, 92 + round(892 * remaining / args.seconds), 1532), radius=6, fill=cyan)
            save_frame(frame, 1, 'countdown', index, tone='tick' if remaining <= 3 else None)
        if args.reveal:
            revealed = question_card(item, index, reveal=True)
            check_mark(revealed, 919, 422, size=38)
            text_block(revealed, f'CORRECT ANSWER: {"ABCD"[item["correctIndex"]]}',
                       (92, 1520, 980, 1600), 34, color=cyan, heavy=True)
            save_frame(revealed, stage_duration(f'a{index}', args.reveal_seconds),
                       'reveal', index, voices.get(f'a{index}'), 'chime')

    outro = base.copy()
    text_block(outro, 'QUIZ COMPLETE', (92, 275, 980, 350), 34, color=cyan, heavy=True)
    text_block(outro, 'How many did\nyou solve?', (92, 480, 970, 800), 88, heavy=True)
    text_block(outro, 'Share your score\nin the comments.', (92, 930, 970, 1140), 55)
    text_block(outro, 'Open the full practice set\nfor answers and more MCQs.', (92, 1330, 970, 1500), 43, color=muted)
    text_block(outro, 'Visit mcqsbase.com/blog', (92, 1580, 970, 1700), 36, color=gold)
    if args.include_outro:
        save_frame(outro, stage_duration('outro', 5), 'outro', audio=voices.get('outro'))

    duration = sum(segment['duration'] for segment in timeline)
    if args.max_duration and duration > args.max_duration:
        raise ValueError('The complete timeline exceeds the short-video duration limit.')
    audio = output / 'soundtrack.wav'
    write_audio(timeline, audio)

    concat = output / 'frames.txt'
    concat.write_text(''.join(f"file 'frames/{segment['frame'].name}'\nduration {segment['duration']}\n" for segment in timeline)
                      + f"file 'frames/{timeline[-1]['frame'].name}'\n", encoding='utf-8')
    video = output / 'mcqsbase-quiz.mp4'
    pending_video = output / 'mcqsbase-quiz.rendering.mp4'
    subprocess.run([find_ffmpeg(args.ffmpeg), '-hide_banner', '-loglevel', 'error', '-y',
                    '-f', 'concat', '-safe', '0', '-i', str(concat), '-i', str(audio),
                    '-t', str(duration), '-vf', 'fps=24,tpad=stop_mode=clone:stop_duration=1',
                    '-r', '24', '-c:v', 'libx264', '-preset', 'fast',
                    '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
                    '-ar', '48000', '-movflags', '+faststart', str(pending_video)], check=True)
    pending_video.replace(video)
    source_url = f'https://www.mcqsbase.com/blog/{args.slug}'
    stages = []
    elapsed = 0
    for segment in timeline:
        stages.append({'start': elapsed, 'duration': segment['duration'],
                       'stage': segment['stage'], 'question': segment['question'], 'frame': segment['frame'].name})
        elapsed += segment['duration']
    manifest = {'title': display_title, 'sourceTitle': source_title, 'sourceUrl': source_url,
                'sourceVerifiedLive': bool(package and package.get('verifiedLive') is True),
                'sourceFetchedAt': package.get('fetchedAt') if package else None,
                'sourceContentHash': package.get('contentHash') if package else None,
                'sourceVerification': package.get('verification') if package else None,
                'productionDeployment': package.get('productionDeployment') if package else None,
                'status': 'local-preview-only', 'count': args.count, 'secondsPerQuestion': args.seconds,
                'durationSeconds': duration, 'width': 1080, 'height': 1920, 'answersIncluded': args.reveal,
                'narration': args.voice, 'voiceName': args.voice_name if args.voice else None,
                'countdownStartsAfterNarration': True, 'seed': args.seed, 'questions': selected, 'stages': stages}
    manifest['introIncluded'] = args.include_intro
    manifest['outroIncluded'] = args.include_outro
    manifest['requestedCount'] = requested_count
    manifest['maxDurationSeconds'] = args.max_duration
    if ordered:
        manifest['sequence'] = {'part': args.batch_part, 'totalParts': args.batch_size,
                                'sourceQuestionNumbers': [q['sourceNumber'] for q in selected]}
    manifest['hashtags'] = social.hashtags(source_title)
    pending_manifest = output / 'manifest.tmp'
    pending_manifest.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    pending_manifest.replace(output / 'manifest.json')
    (output / 'first-comment.txt').write_text(f'Full practice set and answers: {source_url}\n', encoding='utf-8')
    captions = social.social_copy(display_title, args.count, source_url)
    if ordered:
        first, last = selected[0]['sourceNumber'], selected[-1]['sourceNumber']
        for caption in captions.values():
            caption['text'] = f'Part {args.batch_part}/{args.batch_size} · Source questions {first}–{last}\n' + caption['text']
            caption['title'] = f'Part {args.batch_part}/{args.batch_size} | Q{first}–{last} | {display_title}'[:100]
    (output / 'caption.txt').write_text(captions['facebook']['text'] + '\n', encoding='utf-8')
    (output / 'platform-captions.json').write_text(json.dumps(captions, ensure_ascii=False, indent=2), encoding='utf-8')
    question_preview = next(segment['frame'] for segment in timeline if segment['question'] == 1)
    shutil.copyfile(question_preview, output / 'preview.png')
    reveal_frame = next((segment['frame'] for segment in timeline if segment['stage'] == 'reveal'), None)
    if reveal_frame:
        shutil.copyfile(reveal_frame, output / 'reveal-preview.png')
    print(json.dumps({'video': str(video), 'durationSeconds': duration, 'questions': len(selected)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument('--slug')
    source_group.add_argument('--article-json', help='Validated source package fetched from the live blog.')
    parser.add_argument('--count', type=int, choices=range(1, 21), default=social.POLICY['questionLimit'])
    parser.add_argument('--selection', choices=('random', 'ordered'), default='random')
    parser.add_argument('--start-question', type=int, default=1)
    parser.add_argument('--batch-part', type=int, default=1)
    parser.add_argument('--batch-size', type=int, default=5)
    parser.add_argument('--max-duration', type=int, default=social.POLICY['maxDurationSeconds'],
                        help='Maximum complete timeline in seconds; reduce questions to fit, 0 for uncapped.')
    parser.add_argument('--include-intro', action='store_true', help='Opt in to the old opening card and narration.')
    parser.add_argument('--no-outro', action='store_false', dest='include_outro', help='Omit the closing card for short voice tests.')
    parser.add_argument('--seconds', type=int, choices=range(3, 31), default=social.POLICY['thinkingSeconds'])
    parser.add_argument('--title', help='Optional display title; defaults to the actual registered article title.')
    parser.add_argument('--no-voice', action='store_false', dest='voice', help='Disable offline Windows narration.')
    parser.add_argument('--no-reveal', action='store_false', dest='reveal', help='Keep answers hidden throughout.')
    parser.add_argument('--voice-name', default='Microsoft Zira Desktop')
    parser.add_argument('--voice-engine', choices=('windows', 'kokoro'), default='kokoro')
    parser.add_argument('--kokoro-model', default=str(ROOT / '.social-automation/voices/kokoro/kokoro-v1.0.fp16.onnx'))
    parser.add_argument('--kokoro-voices', default=str(ROOT / '.social-automation/voices/kokoro/voices-v1.0.bin'))
    parser.add_argument('--kokoro-voice', default='af_heart')
    parser.add_argument('--voice-rate', type=int, choices=range(-10, 11), default=1)
    parser.add_argument('--reveal-seconds', type=int, choices=range(2, 16), default=3)
    parser.add_argument('--seed', default='mcqsbase-demo')
    parser.add_argument('--output', default=str(ROOT / '.social-automation' / 'quiz-video-demo'))
    parser.add_argument('--font')
    parser.add_argument('--bold-font')
    parser.add_argument('--ffmpeg')
    create_video(parser.parse_args())
