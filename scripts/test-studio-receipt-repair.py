import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('probe', Path(__file__).with_name('probe-studio-cloud.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class ReceiptRepair(unittest.TestCase):
    def setUp(self):
        self.proofs = json.loads((Path(__file__).resolve().parents[1] / 'config/quiz-batch-public-proof.json').read_text())
        self.post = {'id': 'cmvwcp8fl023yro9di7laeszq', 'state': 'ERROR', 'releaseId': '2269299303907745',
            'integration': {'id': 'cmvwb4faa021yro9dgcj8vlww'}}

    def test_only_existing_release_metadata_is_changed(self):
        writes = []
        probe.reconcile_approved_receipt([self.post], lambda *a, **k: writes.append((a, k)), self.proofs)
        self.assertEqual(writes, [(('/posts/' + self.post['id'] + '/release-id',
            {'releaseId': self.post['releaseId']}), {'method': 'PUT'})])

    def test_already_published_receipt_is_not_written_again(self):
        self.post['state'] = 'PUBLISHED'
        probe.reconcile_approved_receipt([self.post], lambda *a, **k: self.fail('repeat write'), self.proofs)

    def test_wrong_release_or_missing_comment_evidence_cannot_be_repaired(self):
        self.post['releaseId'] = 'different'
        with self.assertRaises(ValueError):
            probe.reconcile_approved_receipt([self.post], lambda *_: self.fail('write'), self.proofs)
        with self.assertRaises(ValueError):
            probe.reconcile_approved_receipt([self.post], lambda *_: self.fail('write'), {})


if __name__ == '__main__':
    unittest.main()
