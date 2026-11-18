"""The Vercel deployment safety net never fails publishing and triggers the hook only when needed."""
import importlib.util
import io
import os
from contextlib import redirect_stdout
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('ensure', Path(__file__).with_name('ensure-production-deployment.py'))
ensure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ensure)

SHA, LATER, OLDER = 'a' * 40, 'b' * 40, 'c' * 40


class FakeGitHub:
    """Deployments appear per call so a test can model Vercel starting late or never."""

    def __init__(self, timeline):
        self.timeline, self.calls = timeline, 0

    def current(self):
        return self.timeline[min(self.calls, len(self.timeline) - 1)]

    def get(self, path):
        deployments, comparison = self.current()
        if path.startswith('/deployments?sha='):
            self.calls += 1
            return [d for d in deployments if d['sha'] == SHA]
        if path.startswith('/deployments?environment='):
            return deployments
        if path.endswith('/statuses?per_page=1'):
            deployment = next(d for d in deployments if f'/deployments/{d["id"]}/' in path)
            return [{'state': deployment['state']}]
        if path.startswith('/compare/'):
            return {'status': comparison}
        raise AssertionError(path)


def deployment(sha, state, number=1):
    return {'id': number, 'sha': sha, 'state': state, 'environment': 'Production', 'creator': {'login': 'vercel[bot]'}}


class EnsureProductionDeployment(unittest.TestCase):
    def run_main(self, timeline, hook='https://api.vercel.com/v1/integrations/deploy/prj_x/y'):
        github = FakeGitHub(timeline)
        output = io.StringIO()
        clock = iter(range(0, 10_000_000, 30))
        with patch.object(ensure, 'GitHub', return_value=github), \
             patch.object(ensure, 'trigger') as trigger, \
             patch.object(ensure.time, 'sleep'), \
             patch.object(ensure.time, 'monotonic', side_effect=lambda: next(clock)), \
             patch.dict(os.environ, {'DEPLOY_SHA': SHA, 'GITHUB_REPOSITORY': 'owner/repo', 'GH_TOKEN': 't',
                                     'VERCEL_DEPLOY_HOOK_URL': hook}), redirect_stdout(output):
            self.assertEqual(ensure.main(), 0)
        return trigger, output.getvalue()

    def test_normal_deployment_needs_no_hook(self):
        trigger, output = self.run_main([([], None), ([deployment(SHA, 'in_progress')], None),
                                         ([deployment(SHA, 'success')], None)])
        trigger.assert_not_called()
        self.assertIn('is live on Production', output)

    def test_missed_push_triggers_the_hook_once_and_confirms_it(self):
        missing = [([deployment(OLDER, 'success')], 'behind')] * 20
        trigger, output = self.run_main(missing + [([deployment(SHA, 'success', 2)], None)])
        trigger.assert_called_once()
        self.assertIn('after the Deploy Hook', output)

    def test_later_deployment_containing_the_commit_counts_as_live(self):
        trigger, output = self.run_main([([deployment(LATER, 'success')], 'ahead')])
        trigger.assert_not_called()
        self.assertIn('via bbbbbbb', output)

    def test_slow_build_is_not_redeployed(self):
        trigger, output = self.run_main([([deployment(SHA, 'in_progress')], None)])
        trigger.assert_not_called()
        self.assertIn('still building', output)

    def test_missing_secret_only_warns(self):
        trigger, output = self.run_main([([deployment(OLDER, 'success')], 'behind')], hook='')
        trigger.assert_not_called()
        self.assertIn('no VERCEL_DEPLOY_HOOK_URL', output)

    def test_hook_url_must_be_vercel(self):
        with self.assertRaises(ValueError):
            ensure.trigger('https://example.com/steal')

    def test_unmerged_run_does_nothing(self):
        with patch.dict(os.environ, {'DEPLOY_SHA': ''}), redirect_stdout(io.StringIO()):
            self.assertEqual(ensure.main(), 0)


if __name__ == '__main__':
    unittest.main()
