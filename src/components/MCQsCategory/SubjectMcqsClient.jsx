"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BaseMcqs from './BaseMcqs';

const ignoreLocalPage = () => {};

export default function SubjectMcqsClient({ initialData, page, subject, title }) {
  const router = useRouter();
  const pageUrl = number => '/mcqs/' + subject + (number > 1 ? '?page=' + number : '');
  if (!initialData.results?.length) return <section className="p-8 text-center"><h1>{title}</h1><p>No questions are available in this subject yet.</p><Link href="/mcqs">Browse other subjects</Link></section>;

  return <>
    <BaseMcqs mcqsData={initialData.results} title={title} currentPage={page}
      setCurrentPage={ignoreLocalPage} totalPages={initialData.totalPages} mcqsPerPage={10} subjectSlug={subject}
      onPageNavigate={number => router.push(pageUrl(number))} />
    <nav aria-label="Question pages" className="flex justify-center gap-8 p-6">
      {page > 1 && <Link href={pageUrl(page - 1)}>Previous questions</Link>}
      {page < initialData.totalPages && <Link href={pageUrl(page + 1)}>Next questions</Link>}
    </nav>
  </>;
}
