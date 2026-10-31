"""Provider-independent publication boundary checks, with no account writes."""
import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('quality_batch_fixture', Path(__file__).with_name('test-quiz-batch.py'))
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


class QualityTests(unittest.TestCase):
    def test_corrupted_source_voice_dimensions_and_timing_are_rejected(self):
        package = fixture.source()
        original = fixture.manifest(package, 1, 1)
        validate = lambda m: fixture.batch.quality.validate_video(m, package['slug'], package['title'], 3)
        self.assertEqual(validate(original), package['url'])
        changes = {'sourceUrl': 'https://example.com/fake', 'sourceTitle': 'Invented test',
                   'sourceVerification': 'local-preview', 'sourceContentHash': 'invalid',
                   'introIncluded': True, 'voiceName': 'robot', 'width': 720,
                   'answersIncluded': False, 'secondsPerQuestion': 5, 'countdownStartsAfterNarration': False}
        for key, value in changes.items():
            with self.subTest(key=key):
                record = copy.deepcopy(original)
                record[key] = value
                with self.assertRaises(ValueError):
                    validate(record)
        for mutate in (lambda m: m['productionDeployment'].update(environment='Preview'),
                       lambda m: m['productionDeployment'].update(state='pending'),
                       lambda m: m['productionDeployment'].pop('publisherRunId'),
                       lambda m: m['stages'][1].update(duration=.5),
                       lambda m: m['stages'][1].update(stage='reveal'),
                       lambda m: m['stages'][0].update(start=1)):
            record = copy.deepcopy(original)
            mutate(record)
            with self.assertRaises(ValueError):
                validate(record)

    def test_existing_five_second_assets_can_be_validated_with_their_original_setting(self):
        package = fixture.source()
        record = fixture.manifest(package, 1, 1, count=1)
        record['secondsPerQuestion'] = 5
        record['stages'][4:4] = [dict(record['stages'][1]), dict(record['stages'][1])]
        elapsed = 0
        for stage in record['stages']:
            stage['start'] = elapsed
            elapsed += stage['duration']
        record['durationSeconds'] = elapsed
        fixture.batch.quality.validate_video(record, package['slug'], package['title'], 5)


if __name__ == '__main__':
    unittest.main()
