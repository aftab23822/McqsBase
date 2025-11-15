import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { generateSEOMetadata } from '../../../src/components/SEO';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../src/components/recaptcha';
import SubcategoriesSection from '../../../src/components/SubcategoriesSection';

// Dynamic imports for all Quiz category components
const QuizComponents = {
  // Core subjects
  'english': () => import('../../../src/components/QuizCategory/EnglishQuiz'),
  'english-literature': () => import('../../../src/components/QuizCategory/EnglishLiteratureQuiz'),
  'urdu': () => import('../../../src/components/QuizCategory/URDUQuiz'),
  'islamic-studies': () => import('../../../src/components/QuizCategory/IslamicStudiesQuiz'),
  'pak-study': () => import('../../../src/components/QuizCategory/PakStudyQuiz'),
  'pakistan-studies': () => import('../../../src/components/QuizCategory/PakStudyQuiz'),
  'general-knowledge': () => import('../../../src/components/QuizCategory/GeneralKnowledgeQuiz'),
  'everyday-science': () => import('../../../src/components/QuizCategory/EverydayScienceQuiz'),
  
  // Sciences
  'biology': () => import('../../../src/components/QuizCategory/BiologyQuiz'),
  'chemistry': () => import('../../../src/components/QuizCategory/ChemistryQuiz'),
  'physics': () => import('../../../src/components/QuizCategory/PhysicsQuiz'),
  'mathematics': () => import('../../../src/components/QuizCategory/MathsQuiz'),
  'maths': () => import('../../../src/components/QuizCategory/MathsQuiz'),
  'statistics': () => import('../../../src/components/QuizCategory/StatisticsQuiz'),
  
  // Computer Science
  'computer': () => import('../../../src/components/QuizCategory/ComputerQuiz'),
  'computer-science': () => import('../../../src/components/QuizCategory/ComputerQuiz'),
  'software-engineering': () => import('../../../src/components/QuizCategory/SoftwareEngineeringQuiz'),
  
  // Business & Economics
  'accounting': () => import('../../../src/components/QuizCategory/AccountingQuiz'),
  'auditing': () => import('../../../src/components/QuizCategory/AuditingQuiz'),
  'economics': () => import('../../../src/components/QuizCategory/EconomicsQuiz'),
  'finance': () => import('../../../src/components/QuizCategory/FinanceQuiz'),
  'hrm': () => import('../../../src/components/QuizCategory/HRMQuiz'),
  'management-sciences': () => import('../../../src/components/QuizCategory/ManagementSciencesQuiz'),
  'marketing': () => import('../../../src/components/QuizCategory/MarketingQuiz'),
  
  // Engineering
  'chemical-engineering': () => import('../../../src/components/QuizCategory/ChemicalEngineeringQuiz'),
  'civil-engineering': () => import('../../../src/components/QuizCategory/CivilEngineeringQuiz'),
  'electrical-engineering': () => import('../../../src/components/QuizCategory/ElectricalEngineeringQuiz'),
  'engineering': () => import('../../../src/components/QuizCategory/EngineeringQuiz'),
  'mechanical-engineering': () => import('../../../src/components/QuizCategory/MechanicalEngineeringQuiz'),
  
  // Medical
  'biochemistry': () => import('../../../src/components/QuizCategory/BiochemistryQuiz'),
  'election-officer': () => import('../../../src/components/QuizCategory/ElectionOfficerQuiz'),
  'international-relations': () => import('../../../src/components/QuizCategory/InternationalRelationsQuiz'),
  'judiciary-and-law': () => import('../../../src/components/QuizCategory/JudiciaryAndLawQuiz'),
  'medical': () => import('../../../src/components/QuizCategory/MedicalQuiz'),
  'pakistan-current-affairs': () => import('../../../src/components/QuizCategory/PakistanCurrentAffairsQuiz'),
  'pathology': () => import('../../../src/components/QuizCategory/PathologyQuiz'),
  'pedagogy': () => import('../../../src/components/QuizCategory/PedagogyQuiz'),
  'pharmacology': () => import('../../../src/components/QuizCategory/PharmacologyQuiz'),
  'physical-education': () => import('../../../src/components/QuizCategory/PhysicalEducationQuiz'),
  'physiology': () => import('../../../src/components/QuizCategory/PhysiologyQuiz'),
  'political-science': () => import('../../../src/components/QuizCategory/PoliticalScienceQuiz'),
  'psychology': () => import('../../../src/components/QuizCategory/PsychologyQuiz'),
  'sociology': () => import('../../../src/components/QuizCategory/SociologyQuiz'),
  'world-current-affairs': () => import('../../../src/components/QuizCategory/WorldCurrentAffairsQuiz'),
};

// Subject title mapping
const subjectTitles = {
  'english': 'English Quiz',
  'english-literature': 'English Literature Quiz',
  'urdu': 'Urdu Quiz',
  'islamic-studies': 'Islamic Studies Quiz',
  'pak-study': 'Pak Study Quiz',
  'pakistan-studies': 'Pakistan Studies Quiz',
  'general-knowledge': 'General Knowledge Quiz',
  'everyday-science': 'Everyday Science Quiz',
  'biology': 'Biology Quiz',
  'chemistry': 'Chemistry Quiz',
  'physics': 'Physics Quiz',
  'mathematics': 'Mathematics Quiz',
  'maths': 'Mathematics Quiz',
  'statistics': 'Statistics Quiz',
  'computer': 'Computer Quiz',
  'computer-science': 'Computer Science Quiz',
  'software-engineering': 'Software Engineering Quiz',
  'accounting': 'Accounting Quiz',
  'auditing': 'Auditing Quiz',
  'economics': 'Economics Quiz',
  'finance': 'Finance Quiz',
  'hrm': 'HRM Quiz',
  'management-sciences': 'Management Sciences Quiz',
  'marketing': 'Marketing Quiz',
  'chemical-engineering': 'Chemical Engineering Quiz',
  'civil-engineering': 'Civil Engineering Quiz',
  'electrical-engineering': 'Electrical Engineering Quiz',
  'engineering': 'Engineering Quiz',
  'mechanical-engineering': 'Mechanical Engineering Quiz',
  'biochemistry': 'Biochemistry Quiz',
  'election-officer': 'Election Officer Quiz',
  'international-relations': 'International Relations Quiz',
  'judiciary-and-law': 'Judiciary and Law Quiz',
  'medical': 'Medical Quiz',
  'pakistan-current-affairs': 'Pakistan Current Affairs Quiz',
  'pathology': 'Pathology Quiz',
  'pedagogy': 'Pedagogy Quiz',
  'pharmacology': 'Pharmacology Quiz',
  'physical-education': 'Physical Education Quiz',
  'physiology': 'Physiology Quiz',
  'political-science': 'Political Science Quiz',
  'psychology': 'Psychology Quiz',
  'sociology': 'Sociology Quiz',
  'world-current-affairs': 'World Current Affairs Quiz',
};

export async function generateMetadata({ params }) {
  // In Next.js 15+, params might be a promise
  const resolvedParams = await params;
  const { subject } = resolvedParams;
  const title = subjectTitles[subject];
  const description = `Practice ${title} for Pakistan competitive exams including FPSC, SPSC, PPSC, and NTS.`;
  const keywords = `${subject} quiz, ${subject} questions, competitive exam preparation, FPSC, SPSC, PPSC, NTS`;

  return generateSEOMetadata({
    title,
    description,
    keywords,
    url: `/quiz/${subject}`
  });
}

export default async function QuizCategoryPage({ params, searchParams }) {
  // In Next.js 15+, params and searchParams might be promises
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { subject } = resolvedParams;
  const pageParam = parseInt(resolvedSearchParams?.page || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';
  let initialTree = undefined;
  
  // Safely get headers
  let host, proto, absoluteBase;
  try {
    let hdrs = headers();
    // Handle if headers() returns a promise
    if (hdrs && typeof hdrs.then === 'function') {
      hdrs = await hdrs;
    }
    // Check if hdrs is a Headers object or has a get method
    if (hdrs && typeof hdrs.get === 'function') {
      host = hdrs.get('host');
      proto = hdrs.get('x-forwarded-proto');
    } else if (hdrs && typeof hdrs === 'object') {
      // Fallback: try to access as plain object
      host = hdrs.host || hdrs['host'];
      proto = hdrs['x-forwarded-proto'] || hdrs['x-forwarded-proto'];
    }
  } catch (error) {
    // If headers() fails, use fallback
    console.warn('Failed to get headers:', error);
  }
  
  proto = proto || (host && host.startsWith('localhost') ? 'http' : 'https');
  absoluteBase = host ? `${proto}://${host}` : '';

  const componentImporter = QuizComponents[subject];
  if (!componentImporter) {
    notFound();
  }

  let QuizComponent;
  try {
    ({ default: QuizComponent } = await componentImporter());
  } catch (error) {
    console.error(`Error loading Quiz component for ${subject}:`, error);
    notFound();
  }

  if (page === 1) {
    try {
      const res = await fetch(`${absoluteBase}/api/quiz/${subject}?page=${page}&limit=10&include=hierarchy`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        initialTree = data?.hierarchy?.tree || undefined;
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      {page === 1 ? <SubcategoriesSection subject={subject} initialTree={initialTree} basePath="quiz" /> : null}
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading quiz…</div>}>
        <QuizComponent />
      </Suspense>
      <Footer />
    </ReCaptchaProvider>
  );
}

// Generate static params for known subjects (optional - for static generation)
export async function generateStaticParams() {
  return Object.keys(QuizComponents).map((subject) => ({
    subject,
  }));
}

export const dynamic = 'force-dynamic';
