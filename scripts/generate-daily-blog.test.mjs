import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAiDraft, validateDraft } from './generate-daily-blog.mjs';
import { assertNoRepeatedSet } from './blog-quality.mjs';

function makeDraft(prefix = 'Practice') {
  return {
    topicName: 'Number reasoning', topicSlug: 'number-reasoning',
    primaryKeyword: 'number reasoning MCQs', title: '100 Number Reasoning MCQs',
    excerpt: 'Independent number reasoning practice.', intro: 'Practise number reasoning.',
    description: 'Work through number problems and explanations.',
    focusRows: Array.from({ length: 5 }, () => ({ area: 'Reasoning', whatToPractice: 'Calculations' })),
    revisionTips: Array(4).fill('Check your reasoning.'),
    faqs: Array.from({ length: 4 }, () => ({ question: 'How can I practise?', answer: 'Solve the problems.' })),
    mcqs: Array.from({ length: 100 }, (_, index) => ({
      question: `${prefix} question ${index + 1}?`, options: ['One', 'Two', 'Three', 'Four'],
      correctAnswer: 'Two', explanation: 'Two follows from the stated conditions.'
    }))
  };
}

async function withResponses(t, drafts, run, status = 200) {
  const requests = [];
  const warnings = [];
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  });
  t.mock.method(console, 'warn', message => warnings.push(message));
  const fetchImpl = async (_url, request) => {
    requests.push(JSON.parse(request.body));
    const draft = drafts[Math.min(requests.length - 1, drafts.length - 1)];
    return {
      ok: status === 200, status,
      json: async () => draft.apiPayload || ({ output_text: typeof draft === 'string' ? draft : JSON.stringify(draft) }),
      text: async () => 'Request rejected'
    };
  };
  await run({ fetchImpl, requests, warnings });
}

test('punctuation and case variants use the publication guard normalization', () => {
  const draft = makeDraft();
  draft.mcqs[99].question = '  PRACTICE   question 1!';
  assert.throws(() => validateDraft(draft), /received 99.*Repeated question examples/);
  assert.throws(() => assertNoRepeatedSet(draft.mcqs.map(item => item.question), []), /repeated/);
});

test('never accepts a short set under the 100-question article structure', () => {
  const draft = makeDraft();
  draft.mcqs.pop();
  assert.throws(() => validateDraft(draft), /exactly 100.*received 99/);
  const invalid = makeDraft();
  invalid.mcqs[99].options = ['One'];
  assert.throws(() => validateDraft(invalid), /received 99/);
});

test('replaces a repeated-question draft inside the existing retry loop', async t => {
  const rejected = makeDraft();
  rejected.mcqs[99].question = 'Practice question 1!';
  const replacement = makeDraft('Replacement').mcqs[0];
  await withResponses(t, [rejected, { mcqs: [replacement] }], async ({ fetchImpl, requests, warnings }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 2);
    assert.match(requests[1].input[1].content, /Previous attempt failed validation.*received 99/);
    assert.match(requests[1].input[1].content, /Practice question 1!/);
    assert.match(requests[1].input[1].content, /exactly 1 replacement MCQ/);
    assert.equal(requests[1].text.format.schema.properties.mcqs.maxItems, 1);
    assert.deepEqual(requests[1].text.format.schema.required, ['mcqs']);
    assert.deepEqual(draft.mcqs[0].question, rejected.mcqs[0].question);
    assert.equal(draft.mcqs[99].question, replacement.question);
    assert.equal(warnings.length, 1);
    assert.doesNotThrow(() => assertNoRepeatedSet(draft.mcqs.map(item => item.question), []));
  });
});

test('published-set overlap is retryable and supplies concrete matching questions', async t => {
  const published = [{ slug: 'prior-set', body: Array.from({ length: 100 }, (_, index) =>
    `| ${index + 1} | Practice question ${index + 1}?<br>A) One<br>B) Two | B) Two |`).join('\n') }];
  await withResponses(t, [makeDraft(), makeDraft('Distinct')], async ({ fetchImpl, requests }) => {
    const draft = await generateAiDraft('2026-10-30', published, { fetchImpl });
    assert.equal(requests.length, 2);
    assert.match(requests[1].input[1].content, /repeats 100 questions from prior-set/);
    assert.match(requests[1].input[1].content, /practice question 1/);
    assert.doesNotThrow(() => assertNoRepeatedSet(draft.mcqs.map(item => item.question), published));
  });
});

test('exhausts only three content attempts and never returns a rejected draft', async t => {
  const rejected = makeDraft();
  rejected.mcqs[99].question = 'Practice question 1!';
  await withResponses(t, [rejected, { mcqs: [rejected.mcqs[0]] }], async ({ fetchImpl, requests, warnings }) => {
    await assert.rejects(generateAiDraft('2026-10-30', [], { fetchImpl }), /exactly 100.*received 99/);
    assert.equal(requests.length, 3);
    assert.equal(warnings.length, 3);
  });
});

test('invalid items are replaced without regenerating retained metadata or valid questions', async t => {
  const rejected = makeDraft();
  rejected.mcqs[99].options = ['One'];
  await withResponses(t, [rejected, { mcqs: [makeDraft('Repaired').mcqs[0]] }], async ({ fetchImpl, requests }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.title, rejected.title);
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].text.format.schema.properties.mcqs.minItems, 1);
  });
});

test('an incomplete repair response preserves the validated 99-question base', async t => {
  const rejected = makeDraft();
  rejected.mcqs.pop();
  const incomplete = { apiPayload: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' } };
  await withResponses(t, [rejected, incomplete, { mcqs: [makeDraft('Final repair').mcqs[0]] }], async ({ fetchImpl, requests, warnings }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 3);
    assert.equal(requests[2].text.format.schema.properties.mcqs.maxItems, 1);
    assert.match(warnings[1], /incomplete response \(max_output_tokens\)/);
    assert.equal(draft.mcqs[0].question, rejected.mcqs[0].question);
  });
});

test('a repaired candidate still cannot overlap a published set', async t => {
  const rejected = makeDraft();
  rejected.mcqs.pop();
  const replacement = makeDraft('Prior').mcqs[0];
  const published = [{ slug: 'prior', body: `| 1 | ${replacement.question}<br>A) One<br>B) Two | B) Two |` }];
  await withResponses(t, [rejected, { mcqs: [replacement] }, makeDraft('Fresh')], async ({ fetchImpl, requests }) => {
    const draft = await generateAiDraft('2026-10-30', published, { fetchImpl });
    assert.equal(requests.length, 3);
    assert.match(requests[2].input[1].content, /repeats 1 questions from prior/);
    assert.equal(requests[2].text.format.name, 'ai_daily_blog');
    assert.doesNotThrow(() => assertNoRepeatedSet(draft.mcqs.map(item => item.question), published));
  });
});

test('malformed JSON retries without changing the publication guard', async t => {
  await withResponses(t, ['{', makeDraft()], async ({ fetchImpl, requests }) => {
    assert.equal((await generateAiDraft('2026-10-30', [], { fetchImpl })).mcqs.length, 100);
    assert.equal(requests.length, 2);
  });
});

test('transport rejection is not mistaken for a correctable content failure', async t => {
  await withResponses(t, [makeDraft()], async ({ fetchImpl, requests }) => {
    await assert.rejects(generateAiDraft('2026-10-30', [], { fetchImpl }), /generation failed \(429\)/);
    assert.equal(requests.length, 1);
  }, 429);
});
