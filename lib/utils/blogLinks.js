// Internal links to blog articles, rendered on the server so crawlers can follow them.
// Without these, articles were reachable only from /blog: the homepage and the articles
// themselves linked to no article, so Google left most of them "Discovered - not indexed".

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sortableDate(article) {
  const value = article?.updatedDate || article?.date;
  if (typeof value !== 'string') return '';
  if (ISO_DATE.test(value)) return value;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  return '';
}

function entries(articles) {
  return Object.entries(articles || {})
    .filter(([slug, article]) => slug && article?.title)
    .map(([slug, article]) => ({
      slug,
      title: article.title,
      category: article.category || '',
      date: sortableDate(article),
    }));
}

function newestFirst(a, b) {
  return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
}

// "nat-ie-stoichiometry" -> ["nat", "nat-ie"]; exam families share these prefixes.
function familyKeys(slug) {
  const parts = slug.split('-');
  return [parts[0], parts.slice(0, 2).join('-')];
}

export function latestArticles(articles, { exclude = [], limit = 8 } = {}) {
  const skip = new Set(exclude);
  return entries(articles)
    .filter((article) => !skip.has(article.slug))
    .sort(newestFirst)
    .slice(0, limit);
}

export function relatedArticles(articles, slug, { limit = 6 } = {}) {
  const all = entries(articles);
  const current = all.find((article) => article.slug === slug);
  if (!current) return [];
  const [family, subfamily] = familyKeys(slug);
  const score = (article) => {
    const [otherFamily, otherSubfamily] = familyKeys(article.slug);
    return (otherSubfamily === subfamily ? 4 : 0) + (otherFamily === family ? 2 : 0)
      + (article.category && article.category === current.category ? 1 : 0);
  };
  return all
    .filter((article) => article.slug !== slug && score(article) > 0)
    .sort((a, b) => score(b) - score(a) || newestFirst(a, b))
    .slice(0, limit);
}

// Related first, then the newest others, never repeating a link or linking to itself.
export function articleLinkGroups(articles, slug, { related = 6, latest = 6 } = {}) {
  const relatedList = relatedArticles(articles, slug, { limit: related });
  const latestList = latestArticles(articles, {
    exclude: [slug, ...relatedList.map((article) => article.slug)],
    limit: latest,
  });
  return { related: relatedList, latest: latestList };
}
