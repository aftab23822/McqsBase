import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublishedBlogs } from './published-blogs.mjs';
import { assertNoRepeatedSet } from './blog-quality.mjs';
import { existsSync } from 'node:fs';
import path from 'node:path';

test('loads all registered articles including guides without Markdown files', async () => {
  const published = await readPublishedBlogs();
  const guide = published.find(article => article.slug === 'how-to-improve-mcq-solving-speed-and-accuracy');
  assert.equal(existsSync(path.join('public', 'blog', guide.slug, 'article.md')), false);
  assert.ok(guide.body.includes('Three-pass') || guide.body.includes('three-pass'));
  assert.ok(published.length > 23);
  assert.ok(published.every(article => article.body.length > 0));
});

test('resolved Markdown bodies still participate in duplicate-question checks', async () => {
  const published = await readPublishedBlogs();
  const { tableQuestions } = await import('./blog-quality.mjs');
  const article = published.find(article => tableQuestions(article.body).length >= 90);
  assert.ok(article);
  assert.throws(() => assertNoRepeatedSet(tableQuestions(article.body), published), /repeats|repeated/);
});
