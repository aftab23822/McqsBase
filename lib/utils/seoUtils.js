/**
 * SEO Utility Functions for McqsBase.com
 * Migrated from src/utils/seoUtils.js with Next.js metadata API integration
 */

// Structured Data Generators
export const generateMCQStructuredData = (category, mcqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${category} MCQs`,
    "description": `Practice ${category} MCQs for Pakistan competitive exams including FPSC, SPSC, PPSC, and NTS.`,
    "url": `https://mcqsbase.com/mcqs/${category.toLowerCase().replace(/\s+/g, '-')}`,
    "itemListElement": mcqs.map((mcq, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Question",
        "name": mcq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": mcq.correctAnswer
        }
      }
    }))
  };
};

export const generateQuizStructuredData = (category, questions) => {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `${category} Quiz`,
    "description": `Take an interactive ${category} quiz to test your knowledge for Pakistan competitive exams.`,
    "url": `https://mcqsbase.com/quiz/${category.toLowerCase().replace(/\s+/g, '-')}`,
    "educationalLevel": "Intermediate",
    "teaches": category,
    "about": {
      "@type": "Thing",
      "name": "Pakistan Competitive Exams"
    }
  };
};

export const generatePastPaperStructuredData = (organization, papers) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${organization} Past Papers`,
    "description": `Download ${organization} past papers for Pakistan competitive exams. Access historical exam papers for better preparation.`,
    "url": `https://mcqsbase.com/past-papers/${organization.toLowerCase()}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": papers.map((paper, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "DigitalDocument",
          "name": paper.title,
          "description": paper.description,
          "url": paper.downloadUrl,
          "datePublished": paper.year
        }
      }))
    }
  };
};

export const generateInterviewStructuredData = (organization, questions) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": `${organization} Interview Questions`,
    "description": `Access past interview questions from ${organization} for Pakistan competitive exams.`,
    "url": `https://mcqsbase.com/past-interviews/${organization.toLowerCase()}`,
    "mainEntity": questions.map((question, index) => ({
      "@type": "Question",
      "name": question.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": question.answer
      }
    }))
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "McqsBase.com",
    "url": "https://mcqsbase.com",
    "logo": "https://mcqsbase.com/eagle.svg",
    "description": "Pakistan's premier platform for competitive exam preparation with MCQs, past papers, and interview materials.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact@mcqsbase.com"
    },
    "sameAs": [
      "https://facebook.com/mcqsbase",
      "https://twitter.com/mcqsbase",
      "https://linkedin.com/company/mcqsbase"
    ]
  };
};

export const generateWebSiteStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "McqsBase.com",
    "url": "https://mcqsbase.com",
    "description": "Pakistan's premier platform for competitive exam preparation",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mcqsbase.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
};

// Next.js Metadata Generators
export const generatePageMetadata = (pageName, category = null, additionalKeywords = []) => {
  const title = generatePageTitle(pageName, category);
  const description = generatePageDescription(pageName, category);
  const keywords = generatePageKeywords(pageName, category, additionalKeywords);
  
  return {
    title,
    description,
    keywords,
    authors: [{ name: 'McqsBase.com' }],
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      url: `https://mcqsbase.com/${pageName.toLowerCase().replace(/\s+/g, '-')}`,
      siteName: 'McqsBase.com',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: 'https://mcqsbase.com/eagle.svg',
          alt: 'McqsBase.com Logo'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://mcqsbase.com/eagle.svg']
    }
  };
};

// SEO Meta Tag Generators
export const generatePageTitle = (pageName, category = null) => {
  const baseTitle = "McqsBase.com";
  if (category) {
    return `${pageName} - ${category} | ${baseTitle}`;
  }
  return `${pageName} | ${baseTitle}`;
};

export const generatePageDescription = (pageName, category = null, keywords = []) => {
  const baseDescription = "Pakistan's premier platform for competitive exam preparation";
  if (category) {
    return `${pageName} for ${category}. ${baseDescription}. Practice MCQs, download past papers, and prepare for FPSC, SPSC, PPSC, and NTS exams.`;
  }
  return `${pageName}. ${baseDescription}. Access thousands of MCQs, past papers, and interview materials.`;
};

export const generatePageKeywords = (pageName, category = null, additionalKeywords = []) => {
  const baseKeywords = [
    "Pakistan competitive exams",
    "MCQs",
    "FPSC",
    "SPSC", 
    "PPSC",
    "NTS",
    "exam preparation"
  ];
  
  const pageKeywords = [pageName.toLowerCase()];
  if (category) {
    pageKeywords.push(category.toLowerCase());
  }
  
  return [...pageKeywords, ...baseKeywords, ...additionalKeywords].join(", ");
};
