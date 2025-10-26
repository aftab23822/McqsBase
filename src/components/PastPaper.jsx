import React from 'react';
import BasePastPaper from './PastPapers/BasePastPaper';
import pastpaperData from "../data/mcqs/past_papers/pastPaperData.json"; // Import the JSON file
// SEO deprecated in App Router\n
const PastPaper = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Past Papers Collection",
    "description": "Download past papers from Pakistan competitive exams including FPSC, SPSC, PPSC, and NTS. Access historical exam papers for better preparation.",
    "url": "https://mcqsbase.com/past-papers",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "FPSC Past Papers",
          "url": "https://mcqsbase.com/past-papers/fpsc"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "SPSC Past Papers",
          "url": "https://mcqsbase.com/past-papers/spsc"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "PPSC Past Papers",
          "url": "https://mcqsbase.com/past-papers/ppsc"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "NTS Past Papers",
          "url": "https://mcqsbase.com/past-papers/nts"
        }
      ]
    }
  };

  return (
    <>
      {/* SEO handled by metadata API */}
      <BasePastPaper pastpaperData={pastpaperData} />
    </>
  );
};

export default PastPaper;
