import pastInterviewData from  "../data/mcqs/interviews/interviewData.json"; // Import the JSON file
import React from 'react';
import BasePastInterview from './PastInterviews/BasePastInterview';
import PastInterviewsRightSideBar from './PastInterviewsRightSideBar';
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
    <section className="full-screen px-4 py-8 bg-gray-100">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="col-span-2 p-6 rounded-lg space-y-6">
          {/* SEO handled by metadata API */}
          <BasePastInterview pastInterviewData={pastInterviewData.questions} />
        </div>
        {/* Right Sidebar */}
        <div className="col-span-1">
          <PastInterviewsRightSideBar />
        </div>
      </div>
    </section>
  );
};

export default PastInterview;
