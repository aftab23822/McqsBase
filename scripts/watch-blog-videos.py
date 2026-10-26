"""Create one narrated quiz video for each newly listed MCQsBase article.

First run baselines older posts and processes only the newest. No publishing
side effects: completed videos wait for a separately authorized publisher.
"""
import argparse
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import HTTPError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.mcqsbase.com'
BLOG = BASE + '/blog'
spec = importlib.util.spec_from_file_location('quiz_video', ROOT / 'scripts/create-quiz-video.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)


def now():
    return datetime.now(timezone.utc).isoformat()


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def raw_text(self):
        if self.tag in ('script', 'style', 'svg'):
            return ''
        if self.tag == 'br':
            return '\n'
        return ''.join(child.raw_text() if isinstance(child, Node) else child for child in self.children)

    def text(self):
        return re.sub(r'\s+', ' ', self.raw_text()).strip()

    def nodes(self, tag=None):
        for child in self.children:
            if isinstance(child, Node):
                if tag is None or child.tag == tag:
                    yield child
                yield from child.nodes(tag)


class Tree(HTMLParser):
    def __init__(self, body):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(body)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def listed_articles(body):
    result, seen = [], set()
    for anchor in Tree(body).root.nodes('a'):
        url = urlparse(urljoin(BLOG, anchor.attrs.get('href', '')))
        match = re.fullmatch(r'/blog/([a-z0-9]+(?:-[a-z0-9]+)*)/?', url.path)
        if url.hostname != 'www.mcqsbase.com' or not match:
            continue
        slug = match.group(1)
        if slug not in seen:
            headings = list(anchor.nodes('h3')) or list(anchor.nodes('h2'))
            title = headings[0].text() if headings else anchor.text()
            result.append({'slug': slug, 'url': f'{BLOG}/{slug}', 'listedTitle': title})
            seen.add(slug)
    if not result:
        raise ValueError('No article links found in the live blog index; nothing was baselined.')
    return result


def article_package(body, slug):
    root = Tree(body).root
    headings = list(root.nodes('h1'))
    if not headings or not headings[0].text():
        raise ValueError('The live article has no readable title.')
    canonical = [node.attrs.get('href') for node in root.nodes('link') if node.attrs.get('rel') == 'canonical']
    expected = f'{BLOG}/{slug}'
    if canonical and canonical[0].rstrip('/') != expected:
        raise ValueError('The article canonical URL does not match the queued article.')
    questions, seen = [], set()
    found_quiz_layout = False
    for card in root.nodes('article'):
        paragraphs = list(card.nodes('p'))
        grids = [node for node in card.nodes('div') if 'grid' in node.attrs.get('class', '').split()]
        if not paragraphs or not grids:
            continue
        found_quiz_layout = True
        choices, labels = [], []
        rows = [node for node in grids[0].children if isinstance(node, Node) and node.tag == 'div']
        for row in rows:
            spans = [node for node in row.children if isinstance(node, Node) and node.tag == 'span']
            if len(spans) != 2:
                break
            labels.append(spans[0].text())
            choices.append(spans[1].text())
        if labels != ['A.', 'B.', 'C.', 'D.'] or len(set(choices)) != 4 or not all(choices):
            continue
        answer_candidates = [re.fullmatch(r'([A-D])\)\s*(.+)',
                             re.sub(r'\s+', ' ', node.raw_text().split('\n')[0]).strip()) for node in paragraphs]
        answers = [match for match in answer_candidates if match]
        if len(answers) != 1:
            continue
        correct = 'ABCD'.index(answers[0].group(1))
        if answers[0].group(2).casefold() != choices[correct].casefold():
            continue
        question = paragraphs[0].text()
        key = hashlib.sha256(question.casefold().encode()).hexdigest()
        if question and key not in seen:
            questions.append({'question': question, 'choices': choices, 'correctIndex': correct, 'key': key})
            seen.add(key)
    if found_quiz_layout and not questions:
        raise ValueError('MCQ cards were found but their answers could not be validated; retry after checking the page format.')
    return {'slug': slug, 'title': headings[0].text(), 'url': expected,
            'verifiedLive': True, 'fetchedAt': now(),
            'contentHash': hashlib.sha256(body.encode()).hexdigest(), 'questions': questions}


def fetch_html(url):
    if urlparse(url).hostname != 'www.mcqsbase.com':
        raise ValueError('Only the MCQsBase website can supply video content.')
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html'})
    with urlopen(request, timeout=30) as response:
        if urlparse(response.geturl()).hostname != 'www.mcqsbase.com':
            raise ValueError('Unexpected redirect away from MCQsBase.')
        if 'text/html' not in response.headers.get('Content-Type', ''):
            raise ValueError('Expected a live HTML page.')
        content = response.read(8_000_001)
        if len(content) > 8_000_000:
            raise ValueError('Live page exceeds the source size limit.')
        return content.decode('utf-8')


def save_json(filename, data):
    filename.parent.mkdir(parents=True, exist_ok=True)
    temporary = filename.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    temporary.replace(filename)


def discover(state, listed):
    initial = not state.get('initializedAt')
    entries = state.setdefault('articles', {})
    discovered = []
    for index, article in enumerate(listed):
        if article['slug'] not in entries:
            baseline = initial and index > 0
            entries[article['slug']] = {**article, 'status': 'baseline' if baseline else 'pending',
                                        'discoveredAt': now()}
            if not baseline:
                discovered.append(article['slug'])
    state.setdefault('initializedAt', now())
    state['lastCheckedAt'] = now()
    state['version'] = 1
    return discovered


def run(args, source_snapshot=None, render_slugs=None):
    state_dir = Path(args.state_dir).resolve()
    state_dir.mkdir(parents=True, exist_ok=True)
    # An OS file lock survives neither crashes nor process termination.
    lock_file = (state_dir / 'watcher.lock').open('a+b')
    try:
        if sys.platform == 'win32':
            import msvcrt
            lock_file.seek(0)
            lock_file.write(b'0')
            lock_file.flush()
            lock_file.seek(0)
            msvcrt.locking(lock_file.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print(json.dumps({'status': 'already-running'}))
        lock_file.close()
        return
    try:
        state_path = state_dir / 'state.json'
        state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
        listed = source_snapshot['articles'] if source_snapshot else listed_articles(fetch_html(BLOG))
        discovered = discover(state, listed)
        save_json(state_path, state)
        entries = state['articles']
        pending = [entry for entry in entries.values() if entry['status'] in ('pending', 'rendering', 'retry')
                   and (render_slugs is None or entry['slug'] in render_slugs)]
        rendered, errors = [], []
        for entry in pending[:args.max_videos]:
            slug = entry['slug']
            output = state_dir / 'videos' / slug
            try:
                # Recover a completed render after a crash before the state save.
                manifest_path = output / 'manifest.json'
                manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
                video_path = output / 'mcqsbase-quiz.mp4'
                if not (video_path.exists() and video_path.stat().st_size > 0
                        and manifest.get('sourceUrl') == entry['url']
                        and (manifest.get('sourceVerifiedLive') is True or
                             (manifest.get('sourceVerification') == 'production-deployment'
                              and manifest.get('productionDeployment', {}).get('state') == 'success'))
                        and 0 < manifest.get('count', 0) <= args.count
                        and manifest.get('durationSeconds', 9999) <= getattr(args, 'max_duration', 89)
                        and manifest.get('introIncluded') is False and manifest.get('narration') is True
                        and manifest.get('answersIncluded') is True):
                    package = (source_snapshot['packages'][slug] if source_snapshot
                               else article_package(fetch_html(entry['url']), slug))
                    if package.get('invalidQuestionTable'):
                        raise ValueError('MCQ table found but no answers could be validated; source review required.')
                    if not package['questions']:
                        entry.update(status='skipped', reason='Not enough valid four-choice MCQs in this article.',
                                     checkedAt=now(), validQuestions=len(package['questions']))
                        save_json(state_path, state)
                        continue
                    source = state_dir / 'sources' / f'{slug}.json'
                    save_json(source, package)
                    entry.update(status='rendering', sourceTitle=package['title'], startedAt=now())
                    save_json(state_path, state)
                    command = [sys.executable, str(ROOT / 'scripts/create-quiz-video.py'),
                                    '--article-json', str(source), '--count', str(min(args.count, len(package['questions']))),
                                    '--max-duration', str(getattr(args, 'max_duration', 89)),
                                    '--seed', slug, '--output', str(output)]
                    if getattr(args, 'voice_engine', None):
                        command.extend(['--voice-engine', args.voice_engine])
                    if getattr(args, 'kokoro_model', None):
                        command.extend(['--kokoro-model', args.kokoro_model])
                    if getattr(args, 'kokoro_voices', None):
                        command.extend(['--kokoro-voices', args.kokoro_voices])
                    subprocess.run(command, check=True)
                    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
                entry.update(status='ready', video=str(video_path), manifest=str(manifest_path),
                             sourceTitle=manifest['sourceTitle'], completedAt=now(),
                             publishingStatus=entry.get('publishingStatus', 'waiting-for-account-connection'))
                entry.pop('error', None)
                save_json(state_path, state)
                rendered.append({'slug': slug, 'video': str(video_path), 'title': manifest['sourceTitle']})
            except Exception as error:
                entry.update(status='retry', error=f'{type(error).__name__}: {error}', lastAttemptAt=now())
                errors.append({'slug': slug, 'error': entry['error']})
                save_json(state_path, state)
                # Do not retry a rate-limited site or proceed through a backlog in this run.
                if isinstance(error, HTTPError) and error.code == 429:
                    break
        print(json.dumps({'status': 'checked', 'newArticles': discovered, 'rendered': rendered,
                          'errors': errors, 'readyCount': sum(e['status'] == 'ready' for e in entries.values()),
                          'pendingCount': sum(e['status'] in ('pending', 'retry', 'rendering') for e in entries.values())}))
    finally:
        lock_file.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', default=str(ROOT / '.social-automation' / 'blog-videos'))
    parser.add_argument('--count', type=int, choices=range(1, 21), default=5)
    parser.add_argument('--max-duration', type=int, default=89)
    parser.add_argument('--max-videos', type=int, choices=range(1, 11), default=1)
    parser.add_argument('--voice-engine', choices=('windows', 'kokoro'), default='kokoro')
    parser.add_argument('--kokoro-model')
    parser.add_argument('--kokoro-voices')
    try:
        run(parser.parse_args())
    except Exception as error:
        print(json.dumps({'status': 'retry-next-run', 'error': f'{type(error).__name__}: {error}'}))
        sys.exit(1)
