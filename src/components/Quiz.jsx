import React from 'react';
import EverydayScienceQuiz from './QuizCategory/EverydayScienceQuiz';
// SEO deprecated in App Router\n
const Quiz = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Interactive Quiz Collection",
    "description": "Interactive quizzes for Pakistan competitive exams. Test your knowledge with timed quizzes in various subjects.",
    "url": "https://www.mcqsbase.com/quiz",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accounting Quiz",
          "url": "https://www.mcqsbase.com/quiz/accounting"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Biology Quiz",
          "url": "https://www.mcqsbase.com/quiz/biology"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Chemistry Quiz",
          "url": "https://www.mcqsbase.com/quiz/chemistry"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Computer Science Quiz",
          "url": "https://www.mcqsbase.com/quiz/computer-science"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Economics Quiz",
          "url": "https://www.mcqsbase.com/quiz/economics"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "English Quiz",
          "url": "https://www.mcqsbase.com/quiz/english"
        },
        {
          "@type": "ListItem",
          "position": 7,
          "name": "Mathematics Quiz",
          "url": "https://www.mcqsbase.com/quiz/mathematics"
        },
        {
          "@type": "ListItem",
          "position": 8,
          "name": "Physics Quiz",
          "url": "https://www.mcqsbase.com/quiz/physics"
        }
      ]
    }
  };

  return (
    <>
      {/* Metadata comes from app/quiz/page.js; this page's own heading and item list are rendered here. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="bg-gray-100 px-4 pt-8">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Online Quiz Practice for Pakistan Competitive Exams</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Timed, subject-wise quizzes for FPSC, SPSC, PPSC, NTS and other exams. Answer each question, then check the
            correct answer to improve speed and accuracy.
          </p>
        </div>
      </section>
      <EverydayScienceQuiz />
    </>
  );
};

export default Quiz;
