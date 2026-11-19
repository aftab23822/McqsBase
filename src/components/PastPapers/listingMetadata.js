// Server-side metadata for past-paper listing pages (commission/department/role[/...]).
import { generateSEOMetadata } from '../SEO';

export function humanizeSlug(slug) {
  return (slug || '').split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function pastPaperListingMetadata(segments) {
  const [commission, , role, ...sub] = segments;
  const commissionLabel = humanizeSlug(commission);
  const roleLabel = humanizeSlug(role);
  const heading = sub.length ? `${roleLabel} - ${humanizeSlug(sub[sub.length - 1])}` : roleLabel;
  return generateSEOMetadata({
    title: `${heading} Past Papers (${commissionLabel}) - McqsBase`,
    description: `Solved ${commissionLabel} ${heading} past paper MCQs with answers and explanations for exam preparation.`,
    keywords: [heading, commissionLabel, 'past papers', 'solved mcqs'].join(', ').toLowerCase(),
    url: `/past-papers/${segments.join('/')}`,
  });
}
