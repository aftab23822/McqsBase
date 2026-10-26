"""Download the upstream Kokoro model and voices for local/cloud narration."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.social-automation/voices/kokoro'
RELEASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/'
# Pin the exact upstream files used for the user-approved voice sample. No
# unauthenticated API lookup is needed on each fresh runner or cache restore.
FILES = (
    {'name': 'kokoro-v1.0.fp16.onnx', 'size': 163527961,
     'digest': 'sha256:f3a290d384fbb27966d462905c71a46cef9e5fd00516b40df32a0b4afe77ac96'},
    {'name': 'voices-v1.0.bin', 'size': 28214398,
     'digest': 'sha256:bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d'},
)


def download(asset):
    destination = TARGET / asset['name']
    digest = asset.get('digest')
    if destination.exists() and destination.stat().st_size == asset['size']:
        if not digest or 'sha256:' + hashlib.sha256(destination.read_bytes()).hexdigest() == digest:
            return
    temporary = destination.with_suffix(destination.suffix + '.download')
    with urlopen(RELEASE + asset['name'], timeout=60) as source, temporary.open('wb') as output:
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
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(download, FILES))
