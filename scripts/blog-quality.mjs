export function questionKey(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function tableQuestions(body) {
  return String(body).split(/\r?\n/)
    .filter(line => /^\|\s*\d+\s*\|/.test(line) && /<br\s*\/?\s*>/i.test(line))
    .map(line => questionKey(line.split('|')[2]?.split(/<br\s*\/?\s*>/i)[0] || ''))
    .filter(Boolean);
}

export function assertNoRepeatedSet(questions, published) {
  const keys = new Set(questions.map(questionKey));
  if (keys.size !== questions.length) throw new Error('Draft contains repeated questions.');
  for (const { slug, body } of published) {
    const prior = new Set(tableQuestions(body));
    const matches = [...keys].filter(key => prior.has(key));
    const common = matches.length;
    if (prior.size && common / Math.min(keys.size, prior.size) >= 0.25) {
      throw new Error(`Draft repeats ${common} questions from ${slug}; revise or expand the existing article. Matching question examples: ${JSON.stringify(matches.slice(0, 3))}.`);
    }
  }
}
