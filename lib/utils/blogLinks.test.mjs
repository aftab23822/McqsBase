import test from 'node:test';
import assert from 'node:assert/strict';
import { latestArticles, relatedArticles, articleLinkGroups } from './blogLinks.js';

const articles = {
  'nat-ie-stoichiometry': { title: 'Stoichiometry', category: 'Subject Guide', date: '2026-11-18' },
  'nat-ie-atomic-bonding': { title: 'Atomic bonding', category: 'Subject Guide', date: '2026-11-14' },
  'nat-ics-database-sql': { title: 'SQL', category: 'Subject Guide', date: '2026-11-10' },
  'mdcat-human-physiology': { title: 'Physiology', category: 'Subject Guide', date: '2026-11-16' },
  'mdcat-genetics-inheritance': { title: 'Genetics', category: 'Subject Guide', date: '2026-11-19' },
  'nts-exam-preparation-complete-guide-2026': { title: 'NTS guide', category: 'Exam Guide', date: '2026' },
  'no-title': { category: 'Exam Guide', date: '2026-11-20' },
};

test('latest articles are newest first, skip excluded and untitled entries', () => {
  const slugs = latestArticles(articles, { exclude: ['mdcat-genetics-inheritance'], limit: 3 }).map((a) => a.slug);
  assert.deepEqual(slugs, ['nat-ie-stoichiometry', 'mdcat-human-physiology', 'nat-ie-atomic-bonding']);
});

test('related articles prefer the same exam subfamily, then family, then category', () => {
  const slugs = relatedArticles(articles, 'nat-ie-stoichiometry', { limit: 3 }).map((a) => a.slug);
  assert.deepEqual(slugs, ['nat-ie-atomic-bonding', 'nat-ics-database-sql', 'mdcat-genetics-inheritance']);
});

test('link groups never repeat a link or link an article to itself', () => {
  const { related, latest } = articleLinkGroups(articles, 'mdcat-human-physiology', { related: 2, latest: 10 });
  const all = [...related, ...latest].map((a) => a.slug);
  assert.equal(new Set(all).size, all.length);
  assert.ok(!all.includes('mdcat-human-physiology'));
  assert.equal(related[0].slug, 'mdcat-genetics-inheritance');
});

test('unknown slugs and empty registries are safe', () => {
  assert.deepEqual(relatedArticles(articles, 'missing'), []);
  assert.deepEqual(latestArticles(undefined), []);
});
