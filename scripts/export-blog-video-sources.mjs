// Export the same registered articles used by the public blog, without executing
// arbitrary content or requiring a database connection. Deployment verification
// belongs to quiz-cloud-state.py and must succeed before this snapshot is used.
import { importedBlogArticles } from '../src/data/importedBlogArticles.js';

const articles = Object.entries(importedBlogArticles).map(([slug, article]) => ({
  slug, title: article.title, date: article.date, body: article.body
}));
articles.sort((a, b) => String(b.date).localeCompare(String(a.date)));
process.stdout.write(JSON.stringify(articles));
