"use client";

import React from 'react';
import GeneralKnowledgeQuiz from './MCQsCategory/GeneralKnowledgeMcqs';
// import SEO from './SEO'; // Deprecated in App Router

const Mcqs = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "MCQs Collection",
    "description": "Comprehensive collection of MCQs for Pakistan competitive exams including FPSC, SPSC, PPSC, and NTS",
    "url": "https://mcqsbase.com/mcqs",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accounting MCQs",
          "url": "https://mcqsbase.com/mcqs/accounting"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Biology MCQs",
          "url": "https://mcqsbase.com/mcqs/biology"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Chemistry MCQs",
          "url": "https://mcqsbase.com/mcqs/chemistry"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Computer Science MCQs",
          "url": "https://mcqsbase.com/mcqs/computer-science"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Economics MCQs",
          "url": "https://mcqsbase.com/mcqs/economics"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "English MCQs",
          "url": "https://mcqsbase.com/mcqs/english"
        },
        {
          "@type": "ListItem",
          "position": 7,
          "name": "Mathematics MCQs",
          "url": "https://mcqsbase.com/mcqs/mathematics"
        },
        {
          "@type": "ListItem",
          "position": 8,
          "name": "Physics MCQs",
          "url": "https://mcqsbase.com/mcqs/physics"
        }
      ]
    }
  };

  return (
    <>
      {/* SEO metadata handled by generateMetadata() in app/mcqs/page.js */}
      <GeneralKnowledgeQuiz />
    </>
  );
};

export default Mcqs;
