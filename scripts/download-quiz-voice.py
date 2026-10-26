"""Download the Piper LJ Speech model and verify the upstream file hashes."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.social-automation/voices'
PREFIX = 'en/en_US/ljspeech/medium/'
VOICE = 'en_US-ljspeech-medium'
BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/'

if __name__ == '__main__':
    TARGET.mkdir(parents=True, exist_ok=True)
    with urlopen(BASE + 'voices.json', timeout=60) as response:
        metadata = json.load(response)[VOICE]
    for filename in (VOICE + '.onnx', VOICE + '.onnx.json', 'MODEL_CARD'):
        target = TARGET / filename
        expected = metadata['files'][PREFIX + filename]['md5_digest']
        if target.exists() and hashlib.md5(target.read_bytes()).hexdigest() == expected:
            continue
        temporary = target.with_suffix(target.suffix + '.download')
        with urlopen(BASE + PREFIX + filename, timeout=60) as source, temporary.open('wb') as output:
            while chunk := source.read(1024 * 1024):
                output.write(chunk)
        if hashlib.md5(temporary.read_bytes()).hexdigest() != expected:
            raise ValueError(f'Upstream integrity check failed for {filename}.')
        temporary.replace(target)
    print(f'Offline voice ready: {TARGET / (VOICE + ".onnx")}')
