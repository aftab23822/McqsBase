import { generateSEOMetadata } from '../../../../../src/components/SEO';
import PastInterviewCategoryPage from '../../../../../src/components/PastInterviewCategoryPage';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }) {
  const { commission, department, role } = await params;
  const commissionLabel = humanizeSlug(commission);
  const departmentLabel = humanizeSlug(department);
  const roleLabel = humanizeSlug(role);

  return generateSEOMetadata({
    title: `${roleLabel} Past Interview Questions - ${commissionLabel} | McqsBase.com`,
    description: `Practice ${roleLabel} past interview questions for ${departmentLabel} under ${commissionLabel}. Prepare for Pakistan public sector interviews with structured questions and answers.`,
    keywords: `${roleLabel} interview questions, ${departmentLabel} interview, ${commissionLabel} past interviews, Pakistan government job interview preparation`,
    url: `/past-interviews/${commission}/${department}/${role}`
  });
}

export default function Page() {
  return <PastInterviewCategoryPage />;
}
