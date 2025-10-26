import React from 'react';
import EverydayScienceQuiz from './QuizCategory/EverydayScienceQuiz';
// SEO deprecated in App Router\n
const Quiz = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Interactive Quiz Collection",
    "description": "Interactive quizzes for Pakistan competitive exams. Test your knowledge with timed quizzes in various subjects.",
    "url": "https://mcqsbase.com/quiz",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accounting Quiz",
          "url": "https://mcqsbase.com/quiz/accounting"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Biology Quiz",
          "url": "https://mcqsbase.com/quiz/biology"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Chemistry Quiz",
          "url": "https://mcqsbase.com/quiz/chemistry"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Computer Science Quiz",
          "url": "https://mcqsbase.com/quiz/computer-science"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Economics Quiz",
          "url": "https://mcqsbase.com/quiz/economics"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "English Quiz",
          "url": "https://mcqsbase.com/quiz/english"
        },
        {
          "@type": "ListItem",
          "position": 7,
          "name": "Mathematics Quiz",
          "url": "https://mcqsbase.com/quiz/mathematics"
        },
        {
          "@type": "ListItem",
          "position": 8,
          "name": "Physics Quiz",
          "url": "https://mcqsbase.com/quiz/physics"
        }
      ]
    }
  };

  return (
    <>
      {/* SEO handled by metadata API */}
      <EverydayScienceQuiz />
    </>
  );
};

export default Quiz;
