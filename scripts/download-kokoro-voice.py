"""Download the upstream Kokoro model and voices for local/cloud narration."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.social-automation/voices/kokoro'
RELEASE = 'https://api.github.com/repos/thewh1teagle/kokoro-onnx/releases/tags/model-files-v1.1'
FILES = ('kokoro-v1.0.fp16.onnx', 'voices-v1.0.bin')


def download(asset):
    destination = TARGET / asset['name']
    digest = asset.get('digest')
    if destination.exists() and destination.stat().st_size == asset['size']:
        if not digest or 'sha256:' + hashlib.sha256(destination.read_bytes()).hexdigest() == digest:
            return
    temporary = destination.with_suffix(destination.suffix + '.download')
    with urlopen(asset['browser_download_url'], timeout=60) as source, temporary.open('wb') as output:
        while chunk := source.read(1024 * 1024):
            output.write(chunk)
    if temporary.stat().st_size != asset['size']:
        raise ValueError('Incomplete voice model download.')
    checksum = hashlib.sha256(temporary.read_bytes()).hexdigest()
    if digest and digest != 'sha256:' + checksum:
        raise ValueError('Upstream model checksum mismatch.')
    temporary.replace(destination)
    print(f'Ready: {asset["name"]} (sha256 {checksum})', flush=True)


if __name__ == '__main__':
    TARGET.mkdir(parents=True, exist_ok=True)
    with urlopen(RELEASE, timeout=30) as source:
        release = json.load(source)
    assets = {asset['name']: asset for asset in release['assets']}
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(download, [assets[name] for name in FILES]))
