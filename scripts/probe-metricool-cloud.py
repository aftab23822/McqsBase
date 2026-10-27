"""Read-only production connection check. Never creates, updates or publishes a post."""
from datetime import datetime, timedelta
import importlib.util
import json
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('make_client', ROOT / 'scripts/metricool-make-client.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


def main():
    client = bridge.MakeClient()
    result = client.call('getBrandSettings')
    brands = result.get('data', []) if isinstance(result, dict) else result
    brand = next((b for b in brands if str(b.get('id')) == '7661098'), None)
    expected = {'facebookData': '851782721355178', 'instagramData': 'mcqsbase',
                'tiktokData': 'McqsBase', 'youtubeData': 'UCLLKmoVGvg_Bf2YEFukUjQQ'}
    if not brand or brand.get('timezone') != 'Asia/Karachi' or brand.get('networksData') != expected:
        raise bridge.BridgeError('The Make connection does not match all four approved MCQsBase accounts.')
    print('Verified MCQsBase brand, timezone and all four connected account identities through Make.')
    current = datetime.now(ZoneInfo('Asia/Karachi'))
    start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = (start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(seconds=1)
    posts = client.call('getScheduledPosts', {'brandId': '7661098', 'fromDate': start.isoformat(),
                                             'toDate': end.isoformat(), 'timezone': 'Asia/Karachi'})
    print('Verified parameterized Metricool calendar read through Make.')
    summary = {'brandVerified': True, 'calendarVerified': True, 'postsResponseType': type(posts).__name__}
    print(json.dumps(summary))


if __name__ == '__main__':
    try:
        main()
    except bridge.BridgeError as error:
        raise SystemExit(str(error)) from None
