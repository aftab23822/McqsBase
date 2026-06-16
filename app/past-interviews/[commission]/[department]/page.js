import { generateSEOMetadata } from '../../../../src/components/SEO';
import PastInterviewDepartmentPage from '../../../../src/components/PastInterviewDepartmentPage';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }) {
  const { commission, department } = await params;
  const commissionLabel = humanizeSlug(commission);
  const departmentLabel = humanizeSlug(department);

  return generateSEOMetadata({
    title: `${departmentLabel} Past Interview Questions - ${commissionLabel} | McqsBase.com`,
    description: `Prepare with ${departmentLabel} past interview questions for ${commissionLabel}. Review real public sector interview questions and answers for Pakistan exam preparation.`,
    keywords: `${departmentLabel} interview questions, ${commissionLabel} past interviews, Pakistan government job interview, public sector interview preparation`,
    url: `/past-interviews/${commission}/${department}`
  });
}

export default function Page() {
  return <PastInterviewDepartmentPage />;
}
