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

    // Strategy 0: EXACT QUESTION TEXT MATCH (100% RELIABLE - MOST RELIABLE METHOD)
    // Convert slug back to question text and find by EXACT text match
    // This eliminates all ambiguity - matches the FULL question text exactly
    const questionTextFromSlug = sanitizedQuestionId.replace(/-/g, ' ');
    
    // Normalize: remove punctuation, extra spaces, convert to lowercase for comparison
    // This handles cases where slug has "aman-17" but question has "Aman-17" or "'Aman-17'"
    const normalizeText = (text) => {
      return text
        .replace(/[''""`]/g, '') // Remove quotes and apostrophes
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
        .replace(/\s+/g, ' ') // Remove extra spaces
        .trim()
        .toLowerCase();
    };
    
    const normalizedSlugText = normalizeText(questionTextFromSlug);
    
    // Fetch all questions in this category and match by normalized text
    // This is more reliable than MongoDB regex for exact matching
    const allQuestionsInCategory = await MCQ.find({
      categoryId: category._id
    })
    .select('_id question options answer explanation submittedBy slug categoryId')
    .lean();
    
    // Extract unique keywords from slug (numbers, names, specific terms)
    // These are critical for accurate matching
    const slugWords = normalizedSlugText.split(' ').filter(w => w.length > 2);
    const uniqueKeywords = slugWords.filter(w => {
      // Include numbers (like "17", "2021")
      if (/^\d+$/.test(w)) return true;
      // Include longer distinctive words (like "aman", "arabian", "naval", "karachi")
      if (w.length >= 4) return true;
      return false;
    });
    
    // Find exact match by comparing normalized question text
    let bestMatch = null;
    let bestMatchScore = 0;
    
    for (const q of allQuestionsInCategory) {
      if (!q.question) continue;
      
      // Normalize question text the same way
      const normalizedQuestion = normalizeText(q.question);
      
      // Calculate match score based on how much of the slug text matches
      let matchScore = 0;
      
      // Exact match (highest priority - 100% score)
      if (normalizedQuestion === normalizedSlugText) {
        matchScore = 100;
        bestMatch = q;
        bestMatchScore = 100;
        break; // Found perfect match, no need to continue
      }
      
      // Check keyword matches (very important for accuracy)
      let keywordMatches = 0;
      if (uniqueKeywords.length > 0) {
        keywordMatches = uniqueKeywords.filter(kw => normalizedQuestion.includes(kw)).length;
        const keywordRatio = keywordMatches / uniqueKeywords.length;
        matchScore += keywordRatio * 40; // Keywords are 40% of score
      }
      
      // Check if question contains the slug text (for truncated slugs)
      if (normalizedSlugText.length > 50 && normalizedQuestion.includes(normalizedSlugText)) {
        const score = (normalizedSlugText.length / normalizedQuestion.length) * 50; // 50% score for substring match
        matchScore += score;
      }
      
      // Check if slug contains question start (for shortened slugs in URL)
      if (normalizedQuestion.length > 50) {
        const questionStart = normalizedQuestion.substring(0, Math.min(normalizedSlugText.length, normalizedQuestion.length));
        if (normalizedSlugText.includes(questionStart) || questionStart === normalizedSlugText.substring(0, questionStart.length)) {
          const score = (questionStart.length / normalizedSlugText.length) * 40; // 40% score for prefix match
          matchScore += score;
        }
      }
      
      // Prefer matches with more keyword matches
      if (keywordMatches >= Math.ceil(uniqueKeywords.length * 0.7)) {
        matchScore += 10; // Bonus for high keyword match
      }
      
      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestMatch = q;
      }
    }
    
    // Only use match if confidence is high AND it has sufficient keyword matches
    // Require at least 70% of unique keywords to match
    const requiredKeywords = uniqueKeywords.length > 0 ? Math.ceil(uniqueKeywords.length * 0.7) : 0;
    const bestMatchKeywords = bestMatch && uniqueKeywords.length > 0
      ? uniqueKeywords.filter(kw => normalizeText(bestMatch.question).includes(kw)).length
      : 0;
    
    if (bestMatch && bestMatchScore >= 70 && (uniqueKeywords.length === 0 || bestMatchKeywords >= requiredKeywords)) {
      question = bestMatch;
      
      // Update slug to match exactly what was requested (for future fast lookups)
      if (bestMatch.slug !== sanitizedQuestionId) {
        MCQ.findByIdAndUpdate(bestMatch._id, { slug: sanitizedQuestionId }).catch(() => {});
      }
      
      return await buildQuestionResponse(question, category, subject);
    }

    // Strategy 1: Lookup by slug (most reliable and SEO-friendly, no visible IDs)
    // Slugs are stored in database and indexed for fast lookups
    // Try exact match first (fastest)
    question = await MCQ.findOne({
      slug: sanitizedQuestionId,
      categoryId: category._id
    }).lean();
    
    if (question) {
      return await buildQuestionResponse(question, category, subject);
    }
    
    // Try slug with slight variations (handles truncation issues)
    // Remove trailing hyphens or common endings that might differ
    const normalizedSlug = sanitizedQuestionId.replace(/-+$/, '').toLowerCase();
    if (normalizedSlug !== sanitizedQuestionId.toLowerCase()) {
      question = await MCQ.findOne({
        slug: { $regex: new RegExp('^' + escapeRegex(normalizedSlug), 'i') },
        categoryId: category._id
      }).lean();
      
      if (question) {
        // Update slug to match exactly what was requested (for future lookups)
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject);
      }
    }
    
    // Try prefix matching (for truncated slugs)
    // If the slug is very long, try matching just the first part
    if (sanitizedQuestionId.length > 80) {
      const prefixSlug = sanitizedQuestionId.substring(0, 80).replace(/-+$/, '');
      
      question = await MCQ.findOne({
        slug: { $regex: new RegExp('^' + escapeRegex(prefixSlug), 'i') },
        categoryId: category._id
      }).lean();
      
      if (question) {
        // Update slug to match exactly what was requested
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject);
      }
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
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
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
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
            }
            
            return await buildQuestionResponse(question, category, subject);
          }
        }
      }
      
      // If no reliable text match, return error (don't guess)
      return { error: 'Multiple questions found with same ID prefix. Unable to determine correct question.', status: 404 };
    }
    
    // Strategy 5: Text-only matching (LAST RESORT - not reliable)
    // Only use this if slug-based matching completely fails
    // This handles URLs where the entire slug is just the question text
    // WARNING: This is unreliable - prefer slug-based matching
    
    // Before text matching, try generating slug from text and matching
    // This helps if the slug format changed or question exists but slug is missing
    const questionText = sanitizedQuestionId.replace(/-/g, ' ');
    
    // Strategy 5a: Try to find question by generating slug from question text
    // This helps if question exists but doesn't have the exact slug
    try {
      const { generateQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
      const generatedSlug = generateQuestionSlug(questionText);
      
      // Try to find question with similar slug (first 80 chars match)
      const slugPrefix = generatedSlug.substring(0, Math.min(80, generatedSlug.length));
      question = await MCQ.findOne({
        categoryId: category._id,
        slug: { $regex: new RegExp('^' + escapeRegex(slugPrefix), 'i') }
      }).lean();
      
      if (question) {
        // Update slug to match exactly
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject);
      }
    } catch (e) {
      // Slug generation failed, continue to other strategies
    }
    
    // Extract significant words (length > 1) for better matching
    // Also handle numbers like "17" in "aman-17"
    // Include single-letter words that might be important (like "a" in some contexts)
    const words = questionText.split(' ').filter(w => w.length > 1 || /^\d+$/.test(w));
    
    if (words.length > 0) {
      // Try exact phrase match first (removing punctuation for better matching)
      const normalizedText = questionText.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const escapedText = escapeRegex(normalizedText);
      
      question = await MCQ.findOne({
        categoryId: category._id,
        question: { $regex: new RegExp(escapedText, 'i') }
      })
      .sort({ createdAt: -1 })
      .lean();
      
      if (!question) {
        // Try matching with original text (in case punctuation matters)
        const originalEscaped = escapeRegex(questionText);
        question = await MCQ.findOne({
          categoryId: category._id,
          question: { $regex: new RegExp(originalEscaped, 'i') }
        })
        .sort({ createdAt: -1 })
        .lean();
      }
      
      if (question) {
        // Generate and store slug if missing (for future lookups)
        if (!question.slug && question.question) {
          const { generateQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
          const newSlug = generateQuestionSlug(question.question);
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
        }
        
        return await buildQuestionResponse(question, category, subject);
      }
      
      // If exact match fails, try matching by key words
      // For longer slugs (10+ words), use a lower threshold (40%), for shorter use 50%
      const minWordsToMatch = words.length >= 10 
        ? Math.ceil(words.length * 0.4) // 40% for long slugs
        : Math.ceil(words.length * 0.5); // 50% for shorter slugs
      
      // Filter out common stop words that don't help with matching
      const stopWords = new Set(['the', 'is', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'a', 'an', 'had', 'was', 'were', 'been', 'being']);
      const significantWords = words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
      
      // Use the most unique/distinctive words first for better filtering
      // Prioritize longer, more specific words (likely to be unique)
      const sortedWords = significantWords.length > 0 
        ? [...significantWords].sort((a, b) => b.length - a.length)
        : [...words].sort((a, b) => b.length - a.length);
      const primaryWords = sortedWords.slice(0, Math.min(6, sortedWords.length)); // Top 6 words
      
      // Build regex pattern using primary words for initial filtering
      const wordPatterns = primaryWords.map(w => escapeRegex(w));
      
      // Use the most distinctive words (longer ones) for initial filtering
      // Try to match at least 2 of the top words
      const topWordsForFilter = wordPatterns.slice(0, Math.min(3, wordPatterns.length));
      const filterPattern = topWordsForFilter.length > 0 
        ? '(' + topWordsForFilter.join('|') + ')'
        : wordPatterns.join('|');
      
      const allQuestions = await MCQ.find({
        categoryId: category._id,
        question: { $regex: new RegExp(filterPattern, 'i') }
      })
      .select('_id question options answer explanation createdAt slug')
      .limit(100) // Increased limit for better matching on long slugs
      .lean();
      
      // Find questions that match at least the minimum number of words
      // Use significant words if available, otherwise use all words
      const wordsToMatch = significantWords.length >= minWordsToMatch ? significantWords : words;
      const matchingQuestions = allQuestions.filter(q => {
        const matches = wordsToMatch.filter(word => 
          new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
        ).length;
        return matches >= minWordsToMatch;
      });
      
      // If no matches with initial threshold, try a more lenient approach
      // But require unique/distinctive words to prevent false matches
      if (matchingQuestions.length === 0 && wordsToMatch.length >= 6) {
        // Identify unique/distinctive words (longer, less common words, or specific terms like numbers/names)
        // These should be required for a match
        const uniqueWords = wordsToMatch.filter(w => {
          const lower = w.toLowerCase();
          // Filter out very common words
          const commonWords = ['how', 'many', 'what', 'when', 'where', 'who', 'which', 'had', 'has', 'have', 'was', 'were', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'off'];
          if (commonWords.includes(lower)) return false;
          // Include numbers (like "17") and names (like "aman") even if short
          if (/^\d+$/.test(w)) return true; // Numbers are unique
          if (w.length >= 4) return true; // Longer words (like "naval", "aman", "arabian")
          return false;
        });
        
        // Identify CRITICAL words - must be present for a valid match
        // These are the most distinctive words that should uniquely identify the question
        const criticalWords = uniqueWords.filter(w => {
          const lower = w.toLowerCase();
          // Numbers and short distinctive names
          if (/^\d+$/.test(w)) return true;
          // Short distinctive terms (like "aman", "obor", etc.)
          if (w.length >= 3 && w.length <= 5 && !commonWords.includes(lower)) return true;
          // Very specific/technical terms
          return w.length >= 6;
        });
        
        // Try matching with fewer words BUT require multiple unique words AND critical words
        // For long slugs, require more unique words to prevent false matches
        const fallbackThreshold = Math.ceil(wordsToMatch.length * 0.35); // 35% instead of 30%
        const minUniqueWords = uniqueWords.length >= 6 
          ? Math.max(4, Math.min(uniqueWords.length, 6)) // Require 4-6 for long slugs
          : Math.max(2, Math.min(uniqueWords.length, 4)); // Require 2-4 for shorter slugs
        const minCriticalWords = criticalWords.length > 0 ? Math.max(2, Math.min(criticalWords.length, 4)) : 0; // Require 2-4 critical words if available
        
        const fallbackMatches = allQuestions.filter(q => {
          const totalMatches = wordsToMatch.filter(word => 
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
          ).length;
          
          // Also require unique words
          const uniqueMatches = uniqueWords.filter(word => 
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
          ).length;
          
          // Require critical words (most important for accuracy)
          const criticalMatches = criticalWords.length > 0
            ? criticalWords.filter(word => 
                new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
              ).length
            : 0;
          
          return totalMatches >= fallbackThreshold 
            && uniqueMatches >= minUniqueWords 
            && (criticalWords.length === 0 || criticalMatches >= minCriticalWords);
        });
        
        if (fallbackMatches.length > 0) {
          // Sort by critical words first (most important), then unique, then total
          fallbackMatches.sort((a, b) => {
            const aTotal = wordsToMatch.filter(word => 
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(a.question)
            ).length;
            const bTotal = wordsToMatch.filter(word => 
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(b.question)
            ).length;
            
            const aUnique = uniqueWords.filter(word => 
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(a.question)
            ).length;
            const bUnique = uniqueWords.filter(word => 
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(b.question)
            ).length;
            
            const aCritical = criticalWords.length > 0
              ? criticalWords.filter(word => 
                  new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(a.question)
                ).length
              : 0;
            const bCritical = criticalWords.length > 0
              ? criticalWords.filter(word => 
                  new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(b.question)
                ).length
              : 0;
            
            // Prioritize critical word matches FIRST (most important for accuracy)
            if (bCritical !== aCritical) return bCritical - aCritical;
            // Then unique word matches
            if (bUnique !== aUnique) return bUnique - aUnique;
            // Finally total matches
            return bTotal - aTotal;
          });
          
          // Only use the match if it has sufficient critical words
          const bestMatch = fallbackMatches[0];
          const bestCriticalMatches = criticalWords.length > 0
            ? criticalWords.filter(word => 
                new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(bestMatch.question)
              ).length
            : 0;
          
          // Require at least 70% of critical words for high reliability
          // Text matching is unreliable, so we need high confidence
          const requiredCritical = Math.ceil(criticalWords.length * 0.7);
          
          const uniqueMatches = uniqueWords.filter(word => new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(bestMatch.question)).length;
          const totalMatches = wordsToMatch.filter(word => new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(bestMatch.question)).length;
          
          // High confidence check: need at least 70% critical words AND 50% total unique words
          const uniqueWordRatio = uniqueWords.length > 0 ? uniqueMatches / uniqueWords.length : 0;
          const hasHighConfidence = criticalWords.length === 0 
            ? uniqueWordRatio >= 0.5 && totalMatches >= Math.ceil(wordsToMatch.length * 0.45)
            : bestCriticalMatches >= requiredCritical && uniqueWordRatio >= 0.5;
          
          if (hasHighConfidence) {
            matchingQuestions.push(bestMatch);
          }
          // Don't add to matchingQuestions if low confidence - return 404 instead of wrong match
        }
      }
      
      if (matchingQuestions.length === 1) {
        question = matchingQuestions[0];
        
        // Generate and store slug using the exact URL slug for perfect match next time
        if (question.question) {
          const { generateUniqueQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
          // Use the exact slug from URL if it doesn't exist, or update to match
          const newSlug = question.slug || await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ);
          
          // If slug doesn't match the requested one, update it to match exactly
          if (newSlug !== sanitizedQuestionId) {
            // Try to use the exact requested slug, or a unique variant
            let finalSlug = sanitizedQuestionId;
            const existing = await MCQ.findOne({ slug: finalSlug, categoryId: category._id });
            if (existing && existing._id.toString() !== question._id.toString()) {
              // Conflict - use generated unique slug
              finalSlug = await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ);
            }
            MCQ.findByIdAndUpdate(question._id, { slug: finalSlug }).catch(() => {});
          }
        }
        
        return await buildQuestionResponse(question, category, subject);
      } else if (matchingQuestions.length > 1) {
        // Multiple matches - prefer the one with most word matches
        matchingQuestions.sort((a, b) => {
          const aMatches = words.filter(word => 
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(a.question)
          ).length;
          const bMatches = words.filter(word => 
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(b.question)
          ).length;
          return bMatches - aMatches;
        });
        
        question = matchingQuestions[0];
        
        // Generate and store slug using the exact URL slug for perfect match next time
        if (question.question) {
          const { generateUniqueQuestionSlug } = await import('@/lib/utils/slugGenerator.js');
          // Use the exact slug from URL if it doesn't exist, or update to match
          let finalSlug = sanitizedQuestionId;
          const existing = await MCQ.findOne({ slug: finalSlug, categoryId: category._id });
          if (existing && existing._id.toString() !== question._id.toString()) {
            // Conflict - use generated unique slug
            finalSlug = await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ);
          }
          MCQ.findByIdAndUpdate(question._id, { slug: finalSlug }).catch(() => {});
        }
        
        return await buildQuestionResponse(question, category, subject);
      }
    }

    // Final fallback - if we still have no question, return error
    if (!question) {
      return { error: 'Question not found', status: 404 };
    }

    // Build and return response with navigation
    return await buildQuestionResponse(question, category, subject);
  } catch (error) {
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
      notFound();
    }

    if (!question || !category) {
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
    notFound();
  }
}


