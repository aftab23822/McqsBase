import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import { generateSEOMetadata } from '../../src/components/SEO';

export const metadata = generateSEOMetadata({
  title: 'Editorial Policy and Corrections - McqsBase',
  description: 'How to interpret McqsBase practice material, verify exam requirements, and report an incorrect answer.',
  url: '/editorial-policy'
});

export default function EditorialPolicy() {
  return <><Navbar /><main className="mx-auto max-w-4xl px-4 py-12 space-y-6 text-gray-700">
    <h1 className="text-4xl font-bold text-gray-900">Editorial policy and corrections</h1>
    <p>McqsBase is an independent exam preparation website. Practice questions and study guides are educational resources. McqsBase is not affiliated with FPSC, SPSC, PPSC, NTS, the armed forces, or a recruiting authority.</p>
    <h2 className="text-2xl font-bold">Practice sets and past papers</h2>
    <p>A practice set is not an official examination paper. A topic appearing here does not establish that it appears in an official syllabus or will be asked in an exam. Check the recruiting authority’s current notice for eligibility, dates, syllabus, marks, and selection procedures.</p>
    <h2 className="text-2xl font-bold">Publication standard</h2>
    <p>New article drafts may be assisted by automated tools. They require editorial review before publication: check the answer against the options, explain the reasoning, verify changing facts using primary sources, and check overlap with existing articles. A publication date is not evidence that every fact was independently verified on that date.</p>
    <h2 className="text-2xl font-bold">Using answers responsibly</h2>
    <p>Some older questions have an answer key without a detailed explanation. Treat an answer key as a revision aid and cross-check disputed answers with your textbook or the official source. Content can contain errors; McqsBase does not guarantee selection, examination success, or a particular score.</p>
    <h2 className="text-2xl font-bold">Report an error</h2>
    <p>Use the <Link className="text-blue-700 underline" href="/contact">contact form</Link> to send the page URL, question text or number, the disputed answer, your proposed correction, and a supporting source. For a changing fact, include the date of the source. These details help the site maintainer investigate the report.</p>
    <h2 className="text-2xl font-bold">Attribution and reuse</h2>
    <p>Do not submit copied articles or question collections you do not have permission to share. When referring to an official paper or external source, identify its origin; do not describe a generated practice set as an official or repeated paper.</p>
    <p className="text-sm">Policy updated October 23, 2026.</p>
  </main><Footer /></>;
}
