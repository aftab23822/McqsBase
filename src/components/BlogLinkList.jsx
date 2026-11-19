import Link from 'next/link';

// Server component: plain anchors in the initial HTML so crawlers can discover articles.
export default function BlogLinkList({ title, articles, viewAll = false }) {
  if (!articles?.length) return null;
  return (
    <section aria-label={title} className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {viewAll && (
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap">
            All articles
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/blog/${article.slug}`}
              className="block h-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              <span className="font-semibold">{article.title}</span>
              {article.date && <span className="block text-sm text-gray-500 mt-1">{article.date}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
