import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IndividualQuestion from '@/components/IndividualQuestion';
import { generateSEOMetadata } from '@/components/SEO';
import { generateQuestionSlug } from '@/lib/utils/slugGenerator.js';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeString, escapeRegex } from '@/lib/utils/security.js';
import mongoose from 'mongoose';

// Revalidate cached data every 1 hour
export const revalidate = 3600;

/**
 * Helper function to build question response with navigation
 */
async function buildQuestionResponse(question, category, subject) {
  const [nextQuestion, prevQuestion] = await Promise.all([
    MCQ.findOne({
      categoryId: category._id,
      $or: [
        { createdAt: { $gt: question.createdAt } },
        { createdAt: question.createdAt, _id: { $gt: question._id } }
      ]
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id')
      .lean(),
    MCQ.findOne({
      categoryId: category._id,
      $or: [
        { createdAt: { $lt: question.createdAt } },
        { createdAt: question.createdAt, _id: { $lt: question._id } }
      ]
    })
      .sort({ createdAt: -1, _id: -1 })
      .select('_id')
      .lean()
  ]);

  return {
    question: {
      ...question,
      _id: question._id.toString(),
      categoryId: question.categoryId?.toString() || question.categoryId,
      submittedBy: question.submittedBy?.toString() || question.submittedBy
    },
    nextQuestionId: nextQuestion?._id?.toString() || null,
    prevQuestionId: prevQuestion?._id?.toString() || null,
    category: {
      name: category.name,
      slug: subject
    }
  };
}

/**
 * Helper function to fetch question data directly from database
 * 
 * Lookup Strategy (in order of reliability):
 * 1. Exact 24-character ObjectId match (most reliable)
 * 2. Extract ObjectId from slug and try exact match
 * 3. For partial IDs (8-23 chars): Match by ID prefix, verify by question text (strict)
 * 4. Text-only matching (for slugs without ID)
 */
async function fetchQuestionData({ subject, questionId }) {
  try {
    await connectToDatabase();

    const sanitizedSubject = sanitizeSubject(subject);
    const sanitizedQuestionId = sanitizeString(questionId);

    if (!sanitizedSubject || !sanitizedQuestionId) {
      return { error: 'Invalid subject or question ID', status: 400 };
    }

    const escapedSubject = escapeRegex(sanitizedSubject);
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') }
    }).lean();

    if (!category) {
      return { error: `Category not found for subject: ${sanitizedSubject}`, status: 404 };
    }

    let question = null;

    // Strategy 1: Lookup by slug (most reliable and SEO-friendly, no visible IDs)
    // Slugs are stored in database and indexed for fast lookups
    question = await MCQ.findOne({
      slug: sanitizedQuestionId,
      categoryId: category._id
    }).lean();
    
    if (question) {
      return await buildQuestionResponse(question, category, subject);
    }

    // Strategy 2: Try exact 24-character ObjectId match (backward compatibility)
    if (/^[0-9a-f]{24}$/i.test(sanitizedQuestionId)) {
      try {
        const objectId = new mongoose.Types.ObjectId(sanitizedQuestionId);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
        if (question) return await buildQuestionResponse(question, category, subject);
      } catch (e) {
        // Invalid ObjectId format
      }
    }

    // Strategy 3: Extract ObjectId from slug (for old URLs with IDs)
    const parts = sanitizedQuestionId.split('-');
    const lastPart = parts[parts.length - 1];
    
    // Try full 24-character ObjectId from last part
    if (lastPart && lastPart.length === 24 && /^[0-9a-f]{24}$/i.test(lastPart)) {
      try {
        const objectId = new mongoose.Types.ObjectId(lastPart);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
        if (question) return await buildQuestionResponse(question, category, subject);
      } catch (e) {
        // Invalid ObjectId format
      }
    }
    
    // Strategy 4: Try partial ID match (for backward compatibility with old URLs containing IDs)
    // Only for IDs that are NOT full ObjectIds (8-23 chars)
    if (lastPart && /^[0-9a-f]{8,23}$/i.test(lastPart) && lastPart.length < 24) {
      // Fetch all questions to find ID prefix matches
      const allQuestions = await MCQ.find({
        categoryId: category._id
      })
      .select('_id question options answer explanation createdAt slug')
      .lean();
      
      // Find exact ID prefix matches
      const idMatches = allQuestions.filter(q => {
        const idStr = q._id.toString().toLowerCase();
        return idStr.startsWith(lastPart.toLowerCase());
      });
      
      if (idMatches.length === 0) {
        return { error: 'Question not found', status: 404 };
      }
      
      if (idMatches.length === 1) {
        // Single match - use it (reliable)
        question = idMatches[0];
        
        // Generate and store slug if missing (for future lookups)
        if (!question.slug && question.question) {
          const { generateQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
          const newSlug = generateQuestionSlug(question.question);
          // Store slug asynchronously (don't block response)
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(err => 
            console.error('Failed to save slug:', err)
          );
        }
        
        return await buildQuestionResponse(question, category, subject);
      }
      
      // Multiple matches - MUST verify by question text
      if (parts.length > 1) {
        const questionTextSlug = parts.slice(0, -1).join('-');
        const questionText = questionTextSlug.replace(/-/g, ' ');
        
        // Extract ALL significant words (length > 2) for better matching
        const allWords = questionText.split(' ').filter(w => w.length > 2);
        
        if (allWords.length > 0) {
          // Find question with maximum word matches
          let bestMatch = null;
          let maxMatches = 0;
          
          for (const candidate of idMatches) {
            const matches = allWords.filter(word => 
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(candidate.question)
            ).length;
            
            if (matches > maxMatches) {
              maxMatches = matches;
              bestMatch = candidate;
            }
          }
          
          // Only use if at least 3 words match (strict requirement)
          if (bestMatch && maxMatches >= 3) {
            question = bestMatch;
            
            // Generate and store slug if missing
            if (!question.slug && question.question) {
              const { generateQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
              const newSlug = generateQuestionSlug(question.question);
              MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(err => 
                console.error('Failed to save slug:', err)
              );
            }
            
            return await buildQuestionResponse(question, category, subject);
          }
        }
      }
      
      // If no reliable text match, return error (don't guess)
      return { error: 'Multiple questions found with same ID prefix. Unable to determine correct question.', status: 404 };
    }
    
    // Strategy 5: Text-only matching (for slugs without ID or as last resort)
    // This handles URLs where the entire slug is just the question text
    const questionText = sanitizedQuestionId.replace(/-/g, ' ');
    const escapedText = escapeRegex(questionText);
    
    question = await MCQ.findOne({
      categoryId: category._id,
      question: { $regex: new RegExp(escapedText, 'i') }
    })
    .sort({ createdAt: -1 })
    .lean();
    
    if (question) {
      // Generate and store slug if missing (for future lookups)
      if (!question.slug && question.question) {
        const { generateQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
        const newSlug = generateQuestionSlug(question.question);
        MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(err => 
          console.error('Failed to save slug:', err)
        );
      }
      
      return await buildQuestionResponse(question, category, subject);
    }

    // Final fallback - if we still have no question, return error
    if (!question) {
      return { error: 'Question not found', status: 404 };
    }

    // Build and return response with navigation
    return await buildQuestionResponse(question, category, subject);
  } catch (error) {
    console.error('[fetchQuestionData] Error:', error);
    return { error: 'Failed to fetch question', status: 500 };
  }
}

/**
 * Generate metadata for individual question page
 */
export async function generateMetadata({ params }) {
  const { subject, questionId } = params;
  
  try {
    const { question, category, error } = await fetchQuestionData({ subject, questionId });

    if (!question || !category) {
      console.error(`Metadata missing data for ${subject}/${questionId}:`, { question: !!question, category: !!category });
      return {
        title: 'Question Not Found | McqsBase.com',
        description: 'The requested question could not be found.'
      };
    }

    // Generate slug for URL
    const slug = generateQuestionSlug(question.question, question._id);
    
    // Truncate question for description (max 160 chars)
    const questionPreview = question.question.length > 160
      ? question.question.substring(0, 157) + '...'
      : question.question;

    const title = `${questionPreview} - ${category.name} MCQs | McqsBase.com`;
    const description = `Practice ${category.name.toLowerCase()} MCQ question: ${questionPreview}${question.explanation ? ' Learn with detailed explanation.' : ''} Part of comprehensive MCQ collection for FPSC, SPSC, PPSC, and NTS exams.`;
    
    const keywords = [
      category.name.toLowerCase(),
      'mcq',
      'question',
      'answer',
      'explanation',
      'competitive exam',
      'FPSC',
      'SPSC',
      'PPSC',
      'NTS'
    ].join(', ');

    const url = `/mcqs/${subject}/question/${slug}`;

    return generateSEOMetadata({
      title,
      description,
      keywords,
      url
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'MCQ Question | McqsBase.com',
      description: 'Practice MCQ questions for competitive exams.'
    };
  }
}

/**
 * Generate structured data (FAQPage schema) for the question
 */
async function generateStructuredData(question, category, subject) {
  const slug = generateQuestionSlug(question.question, question._id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcqsbase.com';
  const questionUrl = `${baseUrl}/mcqs/${subject}/question/${slug}`;
  
  // Get correct answer text
  const correctAnswerText = question.options.find(opt => 
    opt.toLowerCase().trim() === question.answer.toLowerCase().trim()
  ) || question.answer;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: {
      '@type': 'Question',
      name: question.question,
      text: question.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: correctAnswerText,
        explanation: question.explanation || undefined
      },
      url: questionUrl,
      dateCreated: question.createdAt,
      author: {
        '@type': 'Organization',
        name: 'McqsBase.com'
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'MCQs',
          item: `${baseUrl}/mcqs`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `${baseUrl}/mcqs/${subject}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Question',
          item: questionUrl
        }
      ]
    }
  };
}

export default async function IndividualQuestionPage({ params }) {
  const { subject, questionId } = params;

  try {
    // Fetch question data directly from database
    const { question, nextQuestionId, prevQuestionId, category, error, status } = await fetchQuestionData({ subject, questionId });

    if (error) {
      console.error(`Error fetching question data for ${subject}/${questionId}:`, error, status);
      notFound();
    }

    if (!question || !category) {
      console.error(`Missing data for ${subject}/${questionId}:`, { question: !!question, category: !!category });
      notFound();
    }

    // Generate structured data
    const structuredData = await generateStructuredData(question, category, subject);

    return (
      <>
        <Navbar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <IndividualQuestion
          question={question}
          subject={subject}
          categoryName={category.name}
          nextQuestionId={nextQuestionId}
          prevQuestionId={prevQuestionId}
        />
        <Footer />
      </>
    );
  } catch (error) {
    console.error('Error loading question page:', error);
    notFound();
  }
}


