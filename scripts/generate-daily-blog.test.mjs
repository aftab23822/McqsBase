import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticle, generateAiDraft, validateDraft } from './generate-daily-blog.mjs';
import { assertNoRepeatedSet, tableQuestions } from './blog-quality.mjs';

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
  const validated = validateDraft(draft);
  assert.equal(validated.mcqs.length, 99);
  assert.doesNotThrow(() => assertNoRepeatedSet(validated.mcqs.map(item => item.question), []));
  assert.throws(() => assertNoRepeatedSet(draft.mcqs.map(item => item.question), []), /repeated/);
});

test('publishes 99 valid questions with truthful metadata and final section numbering', () => {
  const draft = makeDraft();
  draft.mcqs.pop();
  draft.intro = 'Practise these 100 questions and aim for 100% accuracy.';
  draft.excerpt = '100 number reasoning MCQs with explanations.';
  draft.description = 'Work through 100 unique valid questions.';
  draft.faqs[0].answer = 'This practice set contains 100 MCQs.';
  draft.mcqs[0].question = 'What is 100 divided by 2?';
  const validated = validateDraft(draft);
  assert.equal(validated.title, '99 Number Reasoning MCQs');
  assert.equal(validated.excerpt, '99 number reasoning MCQs with explanations.');
  assert.equal(validated.intro, 'Practise these 99 questions and aim for 100% accuracy.');
  assert.equal(validated.description, 'Work through 99 unique valid questions.');
  assert.match(validated.faqs[0].answer, /99 MCQs/);
  assert.equal(validated.mcqs[0].question, draft.mcqs[0].question);
  const article = buildArticle(validated, '2026-11-06');
  assert.equal(article.title, validated.title);
  assert.equal(tableQuestions(article.body).length, 99);
  assert.match(article.body, /\| Set 5 \| 81-99 \|/);
  assert.match(article.body, /81-99\. Number reasoning MCQs/);
  assert.match(article.body, /complete the 99 Number reasoning MCQs/);
  assert.doesNotMatch(article.body, /81-100|\| 100 \|/);
});

test('drops invalid questions while accepting 99 and rejects counts outside 99-100', () => {
  const invalid = makeDraft();
  invalid.mcqs[99].options = ['One'];
  assert.equal(validateDraft(invalid).mcqs.length, 99);
  const short = makeDraft();
  short.mcqs.splice(98);
  assert.throws(() => validateDraft(short), /99 or 100.*received 98/);
  const long = makeDraft();
  long.mcqs.push(makeDraft('Extra').mcqs[0]);
  assert.throws(() => validateDraft(long), /99 or 100.*received 101/);
  const complete = validateDraft(makeDraft());
  assert.equal(complete.title, '100 Number Reasoning MCQs');
  assert.match(buildArticle(complete, '2026-11-06').body, /81-100/);
});

test('two incomplete responses followed by 99 valid questions succeeds on the final attempt', async t => {
  const accepted = makeDraft();
  accepted.mcqs.pop();
  const incomplete = { apiPayload: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' } };
  await withResponses(t, [incomplete, incomplete, accepted], async ({ fetchImpl, requests, warnings }) => {
    const draft = await generateAiDraft('2026-11-06', [], { fetchImpl });
    assert.equal(draft.mcqs.length, 99);
    assert.equal(draft.title, '99 Number Reasoning MCQs');
    assert.equal(requests.length, 3);
    assert.equal(warnings.length, 2);
    assert.equal(requests[0].text.format.schema.properties.mcqs.minItems, 99);
    assert.equal(requests[0].text.format.schema.properties.mcqs.maxItems, 100);
  });
});

test('99 valid questions finish without an unnecessary repair request', async t => {
  const accepted = makeDraft();
  accepted.mcqs.pop();
  await withResponses(t, [accepted], async ({ fetchImpl, requests }) => {
    assert.equal((await generateAiDraft('2026-11-06', [], { fetchImpl })).mcqs.length, 99);
    assert.equal(requests.length, 1);
  });
});

test('replaces a repeated-question draft inside the existing retry loop', async t => {
  const rejected = makeDraft();
  rejected.mcqs[98].question = 'Practice question 1!';
  rejected.mcqs[99].question = 'Practice question 1!';
  const replacements = makeDraft('Replacement').mcqs.slice(0, 2);
  await withResponses(t, [rejected, { mcqs: replacements }], async ({ fetchImpl, requests, warnings }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 2);
    assert.match(requests[1].input[1].content, /Previous attempt failed validation.*received 98/);
    assert.match(requests[1].input[1].content, /Practice question 1!/);
    assert.match(requests[1].input[1].content, /exactly 2 replacement MCQ/);
    assert.equal(requests[1].text.format.schema.properties.mcqs.maxItems, 2);
    assert.deepEqual(requests[1].text.format.schema.required, ['mcqs']);
    assert.deepEqual(draft.mcqs[0].question, rejected.mcqs[0].question);
    assert.equal(draft.mcqs[99].question, replacements[1].question);
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
  rejected.mcqs[98].question = 'Practice question 1!';
  rejected.mcqs[99].question = 'Practice question 1!';
  await withResponses(t, [rejected, { mcqs: [rejected.mcqs[0]] }], async ({ fetchImpl, requests, warnings }) => {
    await assert.rejects(generateAiDraft('2026-10-30', [], { fetchImpl }), /99 or 100.*received 98/);
    assert.equal(requests.length, 3);
    assert.equal(warnings.length, 3);
  });
});

test('invalid items are replaced without regenerating retained metadata or valid questions', async t => {
  const rejected = makeDraft();
  rejected.mcqs[98].options = ['One'];
  rejected.mcqs[99].options = ['One'];
  await withResponses(t, [rejected, { mcqs: makeDraft('Repaired').mcqs.slice(0, 2) }], async ({ fetchImpl, requests }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.title, rejected.title);
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].text.format.schema.properties.mcqs.minItems, 2);
  });
});

test('an incomplete repair response preserves the validated 98-question base', async t => {
  const rejected = makeDraft();
  rejected.mcqs.splice(98);
  const incomplete = { apiPayload: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' } };
  await withResponses(t, [rejected, incomplete, { mcqs: makeDraft('Final repair').mcqs.slice(0, 2) }], async ({ fetchImpl, requests, warnings }) => {
    const draft = await generateAiDraft('2026-10-30', [], { fetchImpl });
    assert.equal(draft.mcqs.length, 100);
    assert.equal(requests.length, 3);
    assert.equal(requests[2].text.format.schema.properties.mcqs.maxItems, 2);
    assert.match(warnings[1], /incomplete response \(max_output_tokens\)/);
    assert.equal(draft.mcqs[0].question, rejected.mcqs[0].question);
  });
});

test('a repaired candidate still cannot overlap a published set', async t => {
  const rejected = makeDraft();
  rejected.mcqs.splice(98);
  const replacement = makeDraft('Prior').mcqs[0];
  const published = [{ slug: 'prior', body: `| 1 | ${replacement.question}<br>A) One<br>B) Two | B) Two |` }];
  await withResponses(t, [rejected, { mcqs: [replacement, makeDraft('Other repair').mcqs[0]] }, makeDraft('Fresh')], async ({ fetchImpl, requests }) => {
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
