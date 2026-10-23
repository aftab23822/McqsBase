import { tableQuestions } from './blog-quality.mjs';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), 'public', 'blog');
const registry = await readFile('src/data/importedBlogArticles.js', 'utf8');
const publishedSlugs = new Set([...registry.matchAll(/^  "([^"]+)": \{/gm)].map(match => match[1]));
const articles = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || !publishedSlugs.has(entry.name)) continue;
  let body;
  try { body = await readFile(path.join(root, entry.name, 'article.md'), 'utf8'); }
  catch { continue; }
  const questions = tableQuestions(body);
  articles.push({ slug: entry.name, questions: new Set(questions), questionCount: questions.length });
}
const pairs = [];
for (let i = 0; i < articles.length; i++) {
  for (let j = i + 1; j < articles.length; j++) {
    const a = articles[i], b = articles[j];
    const common = [...a.questions].filter(question => b.questions.has(question)).length;
    const denominator = Math.min(a.questions.size, b.questions.size);
    if (denominator && common / denominator >= 0.25) {
      pairs.push({ first: a.slug, second: b.slug, sharedQuestions: common,
        percentageOfSmallerSet: Math.round(common / denominator * 100) });
    }
  }
}
pairs.sort((a, b) => b.sharedQuestions - a.sharedQuestions);
const report = {
  method: 'Exact normalized question-text overlap in Markdown tables; this does not establish plagiarism or answer accuracy.',
  articlesScanned: articles.length,
  articles: articles.map(({ slug, questionCount, questions }) => ({ slug, questionCount, duplicateQuestionsWithinArticle: questionCount - questions.size })),
  pairs
};
await mkdir('docs', { recursive: true });
await writeFile('docs/blog-overlap-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ articlesScanned: articles.length, overlappingPairs: pairs.length, strongestOverlap: pairs.slice(0, 5) }, null, 2));
