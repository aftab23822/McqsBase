import test from 'node:test';
import assert from 'node:assert/strict';
import { tableQuestions, assertNoRepeatedSet } from './blog-quality.mjs';

test('extracts MCQs but ignores numbered focus-area tables', () => {
  assert.deepEqual(tableQuestions('| 1 | Algebra | Practise equations |\r\n| 1 | What is 2+2?<br />A) 3<br />B) 4 | B) 4 |'), ['what is 2 2']);
});

test('blocks a dated re-publication while allowing a distinct practice set', () => {
  const published = [{ slug: 'original', body: '| 1 | What is 2+2?<br>A) 3<br>B) 4 | B) 4 |' }];
  assert.throws(() => assertNoRepeatedSet(['What is 2+2?'], published), /original/);
  assert.doesNotThrow(() => assertNoRepeatedSet(['Which word is an adjective?'], published));
  assert.throws(() => assertNoRepeatedSet(['Same question?', 'Same question!'], []), /repeated/);
  assert.throws(() => assertNoRepeatedSet(['7. Which number is divisible by 9?', '8. Which number is divisible by 9?'], []), /repeated/);
});
