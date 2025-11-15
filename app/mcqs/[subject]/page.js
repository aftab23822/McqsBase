import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { generateSEOMetadata } from '../../../src/components/SEO';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../src/components/recaptcha';
import SubcategoriesSection from '../../../src/components/SubcategoriesSection';

// Dynamic imports for all MCQ category components
const MCQComponents = {
  // Core subjects
  'english': () => import('../../../src/components/MCQsCategory/EnglishMcqs'),
  'english-literature': () => import('../../../src/components/MCQsCategory/EnglishLiteratureMcqs'),
  'urdu': () => import('../../../src/components/MCQsCategory/URDUMcqs'),
  'islamic-studies': () => import('../../../src/components/MCQsCategory/IslamicStudiesMcqs'),
  'pak-study': () => import('../../../src/components/MCQsCategory/PakStudyMcqs'),
  'pakistan-studies': () => import('../../../src/components/MCQsCategory/PakStudyMcqs'),
  'general-knowledge': () => import('../../../src/components/MCQsCategory/GeneralKnowledgeMcqs'),
  'everyday-science': () => import('../../../src/components/MCQsCategory/EverydayScienceMcqs'),
  
  // Sciences
  'biology': () => import('../../../src/components/MCQsCategory/BiologyMcqs'),
  'chemistry': () => import('../../../src/components/MCQsCategory/ChemistryMcqs'),
  'physics': () => import('../../../src/components/MCQsCategory/PhysicsMcqs'),
  'mathematics': () => import('../../../src/components/MCQsCategory/MathsMcqs'),
  'maths': () => import('../../../src/components/MCQsCategory/MathsMcqs'),
  'statistics': () => import('../../../src/components/MCQsCategory/StatisticsMcqs'),
  
  // Computer Science
  'computer': () => import('../../../src/components/MCQsCategory/ComputerMcqs'),
  'computer-science': () => import('../../../src/components/MCQsCategory/ComputerMcqs'),
  'software-engineering': () => import('../../../src/components/MCQsCategory/SoftwareEngineeringMcqs'),
  
  // Business & Economics
  'accounting': () => import('../../../src/components/MCQsCategory/AccountingMcqs'),
  'auditing': () => import('../../../src/components/MCQsCategory/AuditingMcqs'),
  'economics': () => import('../../../src/components/MCQsCategory/EconomicsMcqs'),
  'finance': () => import('../../../src/components/MCQsCategory/FinanceMcqs'),
  'marketing': () => import('../../../src/components/MCQsCategory/MarketingMcqs'),
  'hrm': () => import('../../../src/components/MCQsCategory/HRMMcqs'),
  'human-resource-management': () => import('../../../src/components/MCQsCategory/HRMMcqs'),
  'management-sciences': () => import('../../../src/components/MCQsCategory/ManagementSciencesMcqs'),
  
  // Medical Sciences
  'medical': () => import('../../../src/components/MCQsCategory/MedicalMcqs'),
  'pathology': () => import('../../../src/components/MCQsCategory/PathologyMcqs'),
  'pharmacology': () => import('../../../src/components/MCQsCategory/PharmacologyMcqs'),
  'biochemistry': () => import('../../../src/components/MCQsCategory/BiochemistryMcqs'),
  'microbiology': () => import('../../../src/components/MCQsCategory/MicrobiologyMcqs'),
  'physiology': () => import('../../../src/components/MCQsCategory/PhysiologyMcqs'),
  'general-anatomy': () => import('../../../src/components/MCQsCategory/GeneralAnatomyMcqs'),
  
  // Dental Sciences  
  'oral-histology': () => import('../../../src/components/MCQsCategory/OralHistologyMcqs'),
  'oral-anatomy': () => import('../../../src/components/MCQsCategory/OralAnatomyMcqs'),
  'oral-pathology-medicine': () => import('../../../src/components/MCQsCategory/OralPathologyMedicineMcqs'),
  'dental-materials': () => import('../../../src/components/MCQsCategory/DentalMaterialsMcqs'),
  
  // Engineering
  'engineering': () => import('../../../src/components/MCQsCategory/EngineeringMcqs'),
  'civil-engineering': () => import('../../../src/components/MCQsCategory/CivilEngineeringMcqs'),
  'mechanical-engineering': () => import('../../../src/components/MCQsCategory/MechanicalEngineeringMcqs'),
  'chemical-engineering': () => import('../../../src/components/MCQsCategory/ChemicalEngineeringMcqs'),
  'electrical-engineering': () => import('../../../src/components/MCQsCategory/ElectricalEngineeringMcqs'),
  
  // Agriculture & Forestry
  'agriculture': () => import('../../../src/components/MCQsCategory/AgricultureMcqs'),
  'forestry': () => import('../../../src/components/MCQsCategory/ForestryMcqs'),
  
  // Education & Social Sciences
  'pedagogy': () => import('../../../src/components/MCQsCategory/PedagogyMcqs'),
  'education': () => import('../../../src/components/MCQsCategory/PedagogyMcqs'),
  'physical-education': () => import('../../../src/components/MCQsCategory/PhysicalEducationMcqs'),
  'psychology': () => import('../../../src/components/MCQsCategory/PsychologyMcqs'),
  'sociology': () => import('../../../src/components/MCQsCategory/SociologyMcqs'),
  'political-science': () => import('../../../src/components/MCQsCategory/PoliticalScienceMcqs'),
  'international-relations': () => import('../../../src/components/MCQsCategory/InternationalRelationsMcqs'),
  
  // Law & Administration
  'judiciary-law': () => import('../../../src/components/MCQsCategory/JudiciaryLawMcqs'),
  'law': () => import('../../../src/components/MCQsCategory/JudiciaryLawMcqs'),
  'election-officer': () => import('../../../src/components/MCQsCategory/ElectionOfficerMcqs'),
  
  // Current Affairs
  'pakistan-current-affairs': () => import('../../../src/components/MCQsCategory/PakistanCurrentAffairsMcqs'),
  'world-current-affairs': () => import('../../../src/components/MCQsCategory/WorldCurrentAffairsMcqs'),
};

// Subject title mapping
const subjectTitles = {
  // Core subjects
  'english': 'English MCQs',
  'english-literature': 'English Literature MCQs',
  'urdu': 'Urdu MCQs',
  'islamic-studies': 'Islamic Studies MCQs',
  'pak-study': 'Pakistan Studies MCQs',
  'pakistan-studies': 'Pakistan Studies MCQs',
  'general-knowledge': 'General Knowledge MCQs',
  'everyday-science': 'Everyday Science MCQs',
  
  // Sciences
  'biology': 'Biology MCQs', 
  'chemistry': 'Chemistry MCQs',
  'physics': 'Physics MCQs',
  'mathematics': 'Mathematics MCQs',
  'maths': 'Mathematics MCQs',
  'statistics': 'Statistics MCQs',
  
  // Computer Science
  'computer': 'Computer Science MCQs',
  'computer-science': 'Computer Science MCQs',
  'software-engineering': 'Software Engineering MCQs',
  
  // Business & Economics
  'accounting': 'Accounting MCQs',
  'auditing': 'Auditing MCQs',
  'economics': 'Economics MCQs',
  'finance': 'Finance MCQs',
  'marketing': 'Marketing MCQs',
  'hrm': 'Human Resource Management MCQs',
  'human-resource-management': 'Human Resource Management MCQs',
  'management-sciences': 'Management Sciences MCQs',
  
  // Medical Sciences
  'medical': 'Medical MCQs',
  'pathology': 'Pathology MCQs',
  'pharmacology': 'Pharmacology MCQs',
  'biochemistry': 'Biochemistry MCQs',
  'microbiology': 'Microbiology MCQs',
  'physiology': 'Physiology MCQs',
  'general-anatomy': 'General Anatomy MCQs',
  
  // Dental Sciences  
  'oral-histology': 'Oral Histology MCQs',
  'oral-anatomy': 'Oral Anatomy MCQs',
  'oral-pathology-medicine': 'Oral Pathology & Medicine MCQs',
  'dental-materials': 'Dental Materials MCQs',
  
  // Engineering
  'engineering': 'Engineering MCQs',
  'civil-engineering': 'Civil Engineering MCQs',
  'mechanical-engineering': 'Mechanical Engineering MCQs',
  'chemical-engineering': 'Chemical Engineering MCQs',
  'electrical-engineering': 'Electrical Engineering MCQs',
  
  // Agriculture & Forestry
  'agriculture': 'Agriculture MCQs',
  'forestry': 'Forestry MCQs',
  
  // Education & Social Sciences
  'pedagogy': 'Pedagogy MCQs',
  'education': 'Pedagogy MCQs',
  'physical-education': 'Physical Education MCQs',
  'psychology': 'Psychology MCQs',
  'sociology': 'Sociology MCQs',
  'political-science': 'Political Science MCQs',
  'international-relations': 'International Relations MCQs',
  
  // Law & Administration
  'judiciary-law': 'Judiciary & Law MCQs',
  'law': 'Judiciary & Law MCQs',
  'election-officer': 'Election Officer MCQs',
  
  // Current Affairs
  'pakistan-current-affairs': 'Pakistan Current Affairs MCQs',
  'world-current-affairs': 'World Current Affairs MCQs',
};

export async function generateMetadata({ params }) {
  // In Next.js 15+, params might be a promise
  const resolvedParams = await params;
  const { subject } = resolvedParams;
  const title = subjectTitles[subject];
  
  if (!title) {
    return {
      title: 'MCQs Not Found',
    };
  }

  return generateSEOMetadata({
    title: `${title} - Practice Questions for Competitive Exams`,
    description: `Comprehensive ${title.toLowerCase()} for Pakistan competitive exams including FPSC, SPSC, PPSC, and NTS. Practice with authentic questions and detailed explanations.`,
    keywords: `${subject} mcqs, ${subject} questions, competitive exam preparation, FPSC, SPSC, PPSC, NTS`,
    url: `/mcqs/${subject}`
  });
}

export default async function MCQCategoryPage({ params, searchParams }) {
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
  
  // Check if the subject has a corresponding component
  const componentImporter = MCQComponents[subject];
  if (!componentImporter) {
    notFound();
  }

  // Load category component; if this fails, 404
  let MCQComponent;
  try {
    ({ default: MCQComponent } = await componentImporter());
  } catch (error) {
    console.error(`Error loading MCQ component for ${subject}:`, error);
    notFound();
  }

  // On page 1, fetch hierarchy along with MCQs in one API call and pass tree down
  if (page === 1) {
    try {
      const res = await fetch(`${absoluteBase}/api/mcqs/${subject}?page=${page}&limit=10&include=hierarchy`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        initialTree = data?.hierarchy?.tree || undefined;
      }
    } catch (e) {
      // Ignore and render without initialTree
    }
  }

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      {page === 1 ? <SubcategoriesSection subject={subject} initialTree={initialTree} /> : null}
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading MCQs…</div>}>
        <MCQComponent key={`${subject}-${page}`} />
      </Suspense>
      <Footer />
    </ReCaptchaProvider>
  );
}

// Generate static params for known subjects (optional - for static generation)
export async function generateStaticParams() {
  return Object.keys(MCQComponents).map((subject) => ({
    subject,
  }));
}

// Ensure this page is rendered at request time so relative/absolute fetch works
export const dynamic = 'force-dynamic';
