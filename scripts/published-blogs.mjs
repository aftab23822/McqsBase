import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function readPublishedBlogs(registryPath = path.join(process.cwd(), 'src', 'data', 'importedBlogArticles.js')) {
  // The registry resolves both Markdown-backed articles and inline guide bodies.
  // Import it rather than assuming that every registered slug has article.md.
  const { importedBlogArticles } = await import(pathToFileURL(registryPath).href);
  return Object.entries(importedBlogArticles).map(([slug, article]) => {
    if (typeof article.body !== 'string') {
      throw new Error(`Published article ${slug} has no readable body.`);
    }
    return { slug, body: article.body };
  });
}
