# SEO Implementation for Individual Questions

This document describes the SEO implementation for making individual MCQ questions searchable on Google.

## Overview

Each MCQ question now has its own dedicated page with:
- Unique URL: `/mcqs/[subject]/question/[questionSlug]`
- SEO-optimized meta tags (title, description, keywords)
- FAQPage structured data (Schema.org JSON-LD)
- Breadcrumb navigation
- Shareable links

## Features Implemented

### 1. Question Slug Generation
- **File**: `lib/utils/slugGenerator.js`
- Generates SEO-friendly URLs from question text
- Format: `question-text-first-60-chars-id-8-chars`
- Example: `what-is-javascript-67f3a2b1`

### 2. Individual Question API
- **Endpoint**: `/api/mcqs/[subject]/question/[questionId]`
- **File**: `app/api/mcqs/[subject]/question/[questionId]/route.js`
- Fetches single question by ID or slug
- Returns question with next/prev navigation IDs

### 3. Individual Question Page
- **Route**: `/mcqs/[subject]/question/[questionId]`
- **File**: `app/mcqs/[subject]/question/[questionId]/page.js`
- Server-rendered page with:
  - Dynamic meta tags from question content
  - FAQPage structured data
  - Breadcrumb structured data
  - Full question display with explanation

### 4. Question Card Component
- **File**: `src/components/IndividualQuestion.jsx`
- Displays single question with:
  - Breadcrumb navigation
  - Previous/Next question links
  - Share functionality
  - Back to category link

### 5. Updated MCQ Listing
- **File**: `src/components/MCQsCategory/BaseMcqs.jsx`
- MCQ cards now link to individual question pages
- "View Full Question" button added

### 6. Updated MCQ Card
- **File**: `src/components/McqCard.jsx`
- Added `explanation` prop support
- Displays explanation when available

### 7. Dynamic Sitemap
- **Endpoint**: `/sitemap-questions.xml`
- **File**: `app/sitemap-questions.xml/route.js`
- Generates XML sitemap for all questions
- Updates automatically when new questions are added

## SEO Best Practices Implemented

### Meta Tags
- **Title**: Question text (truncated to 60 chars) + Category + Site Name
- **Description**: Question preview + context + keywords
- **Keywords**: Category, MCQ, question, answer, explanation, competitive exam keywords
- **Canonical URL**: Unique URL for each question
- **Open Graph**: For social media sharing
- **Twitter Card**: Optimized for Twitter sharing

### Structured Data (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": {
    "@type": "Question",
    "name": "Question text",
    "text": "Question text",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Correct answer",
      "explanation": "Explanation if available"
    },
    "url": "Question URL",
    "dateCreated": "Creation date",
    "author": {
      "@type": "Organization",
      "name": "McqsBase.com"
    }
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [...]
  }
}
```

### URL Structure
- Clean, readable URLs: `/mcqs/computer/question/what-is-javascript-67f3a2b1`
- Includes question text for SEO
- Includes unique ID for uniqueness
- Category slug for context

### Internal Linking
- Questions link to their category page
- Previous/Next navigation between questions
- Breadcrumb links to parent pages
- All links use Next.js Link for SEO

## How It Works

### 1. Question Discovery
When a user clicks on a question card in the listing page:
- Clicking the card or "View Full Question" navigates to individual page
- URL is generated using slug generator
- Page loads with full question content

### 2. Google Indexing
- Google crawls individual question pages
- FAQPage schema helps Google understand question structure
- Question text appears in search results
- Users can find specific questions via Google search

### 3. Shareability
- Each question has a unique, shareable URL
- Copy link functionality available
- URL includes question context in slug

## Testing

### Manual Testing
1. Visit any MCQ category: `/mcqs/computer`
2. Click on any question card
3. Verify URL format: `/mcqs/computer/question/[slug]`
4. Check meta tags in browser dev tools
5. View page source for structured data

### Sitemap Testing
1. Visit: `/sitemap-questions.xml`
2. Verify all questions are listed
3. Check URL format is correct
4. Verify lastmod dates are accurate

### Google Search Console
1. Submit sitemap: `https://mcqsbase.com/sitemap-questions.xml`
2. Monitor indexing status
3. Check for crawl errors
4. Monitor search performance

## Performance Considerations

- **Caching**: Questions cached for 1 hour (revalidate: 3600)
- **Sitemap**: Cached for 1 hour, stale-while-revalidate for 24 hours
- **API**: Uses `.lean()` for faster MongoDB queries
- **Server-side rendering**: All question pages are SSR for better SEO

## Future Enhancements

1. **Question Indexing**: Add question index field for faster lookups
2. **Related Questions**: Show related questions based on keywords
3. **Question Analytics**: Track which questions are most searched
4. **Automatic Sitemap Updates**: Real-time sitemap updates on question creation
5. **Question Tags**: Add tagging system for better categorization

## Files Modified/Created

### New Files
- `lib/utils/slugGenerator.js` - Slug generation utilities
- `app/api/mcqs/[subject]/question/[questionId]/route.js` - Single question API
- `app/mcqs/[subject]/question/[questionId]/page.js` - Individual question page
- `src/components/IndividualQuestion.jsx` - Question display component
- `app/sitemap-questions.xml/route.js` - Questions sitemap generator

### Modified Files
- `src/components/MCQsCategory/BaseMcqs.jsx` - Added links to individual pages
- `src/components/McqCard.jsx` - Added explanation display support

## Notes

- Question slugs are generated dynamically from question text
- Full ObjectId or 8-char ID prefix both work for question lookup
- Questions are linked from category listing pages
- All question pages include proper structured data for SEO

