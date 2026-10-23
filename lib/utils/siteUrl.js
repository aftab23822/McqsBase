// All public metadata and sitemaps use the same production origin, even when
// an older deployment environment still contains the apex domain.
export const SITE_URL = 'https://www.mcqsbase.com';

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}
