import pastInterviewData from  "../data/mcqs/interviews/interviewData.json"; // Import the JSON file
import React from 'react';
import BasePastInterview from './PastInterviews/BasePastInterview';
// SEO deprecated in App Router\n
const PastInterview = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Past Interview Questions",
    "description": "Access past interview questions from Pakistan competitive exams. Prepare for interviews with questions from FPSC, SPSC, PPSC, and NTS interviews.",
    "url": "https://mcqsbase.com/past-interviews",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "FPSC Interview Questions",
          "url": "https://mcqsbase.com/past-interviews/fpsc"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "SPSC Interview Questions",
          "url": "https://mcqsbase.com/past-interviews/spsc"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "PPSC Interview Questions",
          "url": "https://mcqsbase.com/past-interviews/ppsc"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "NTS Interview Questions",
          "url": "https://mcqsbase.com/past-interviews/nts"
        }
      ]
    }
  };

  return (
    <>
      {/* SEO handled by metadata API */}
      <BasePastInterview pastInterviewData={pastInterviewData.questions} />
    </>
  );
};

export default PastInterview;
