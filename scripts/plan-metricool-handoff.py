"""Skip all publishing dependencies and social calls when no selected campaign is ready."""
import importlib.util
import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
batch_policy = json.loads((ROOT / 'config/quiz-batch-policy.json').read_text(encoding='utf-8'))
if batch_policy['enabled']:
    with Path(os.environ['GITHUB_OUTPUT']).open('a', encoding='utf-8') as output:
        output.write('handoff=false\n')
    print('Daily five-video Studio batches replace the legacy Metricool handoff; no social calls.')
    raise SystemExit(0)
spec = importlib.util.spec_from_file_location('campaign_gate', ROOT / 'scripts/plan-blog-video-campaign.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
state = gate.load_state(os.environ['GITHUB_REPOSITORY'], os.environ['GH_TOKEN'])
pending = any(entry.get('status') == 'ready' and entry.get('campaign')
              and entry.get('publishingStatus') != 'published' for entry in state.get('articles', {}).values())
approval = json.loads((ROOT / 'config/quiz-approved-launch.json').read_text(encoding='utf-8'))
instant = datetime.now(ZoneInfo('Asia/Karachi'))
window = sum(instant.day >= day for day in (1, 8, 15, 22))
launch_pending = (instant.strftime('%Y-%m') == approval['month'] and window == approval['window']
                  and not state.get('articles', {}).get(approval['slug'], {}).get('campaign')
                  and state.get('integrationTests', {}).get(approval['integrationTestId'], {}).get('status') == 'verified')
pending = pending or launch_pending
with Path(os.environ['GITHUB_OUTPUT']).open('a', encoding='utf-8') as output:
    output.write('handoff=' + str(pending).lower() + '\n')
print('Selected campaign requires handoff or verification.' if pending else
      'No selected campaign awaits handoff; skip publishing dependencies and all social calls.')
