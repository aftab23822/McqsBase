import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Navbar from '../../../../src/components/Navbar';
import Footer from '../../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../../src/components/recaptcha';
import SubcategoryMcqs from '../../../../src/components/MCQsCategory/SubcategoryMcqs';
import IndividualQuestion from '../../../../src/components/IndividualQuestion';
import { generateSEOMetadata } from '../../../../src/components/SEO';
import { normalizeCategoryName } from '../../../../src/utils/categoryConfig';
import { generateQuestionSlug, generateUniqueQuestionSlug } from '../../../../lib/utils/slugGenerator.js';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { sanitizeSubject, sanitizeString, escapeRegex } from '../../../../lib/utils/security.js';
import mongoose from 'mongoose';
import { resolveQuestionByIdentifier } from '../../../../lib/services/questionResolver.js';

function humanize(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function humanizePath(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments.map(humanize).join(' / ');
}

function normalizeSegments(rawSegments) {
  if (!Array.isArray(rawSegments)) return [];
  const normalized = [];
  for (const segment of rawSegments) {
    const norm = normalizeCategoryName(segment || '');
    if (!norm) return [];
    normalized.push(norm);
  }
  return normalized;
}

const QUESTION_SEGMENT = 'question';

function isQuestionRoute(rawSegments) {
  return Array.isArray(rawSegments) && rawSegments.length >= 2 && rawSegments[rawSegments.length - 2] === QUESTION_SEGMENT;
}

function combineSubjectPath(subject, subpath) {
  const segments = [subject, ...(Array.isArray(subpath) ? subpath : [])]
    .map(segment => (segment || '').trim())
    .filter(Boolean);
  return {
    segments,
    path: segments.join('/')
  };
}

async function buildQuestionResponse(question, category, subject, subjectPath) {
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

  const resolvedSubjectPath = subjectPath || subject;

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
      slug: resolvedSubjectPath
    },
    subjectPath: resolvedSubjectPath
  };
}

async function fetchQuestionData({ subject, questionId, subcategorySegments = [] }) {
  try {
    await connectToDatabase();

    const sanitizedSubject = sanitizeSubject(subject);
    const sanitizedQuestionId = sanitizeString(questionId);

    if (!sanitizedSubject || !sanitizedQuestionId) {
      return { error: 'Invalid subject or question ID', status: 400 };
    }

    const { path: subjectPath } = combineSubjectPath(sanitizedSubject, subcategorySegments);

    const escapedSubject = escapeRegex(sanitizedSubject);
    const category = await Category.findOne({
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') }
    }).lean();

    if (!category) {
      return { error: `Category not found for subject: ${sanitizedSubject}`, status: 404 };
    }

    let question = await resolveQuestionByIdentifier({
      categoryId: category._id,
      identifier: sanitizedQuestionId
    });

    if (question) {
      return await buildQuestionResponse(question, category, subject, subjectPath);
    }

    const questionTextFromSlug = sanitizedQuestionId.replace(/-/g, ' ');

    const normalizeText = (text) =>
      text
        .replace(/[''""`]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const normalizedSlugText = normalizeText(questionTextFromSlug);

    const allQuestionsInCategory = await MCQ.find({
      categoryId: category._id
    })
      .select('_id question options answer explanation submittedBy slug categoryId')
      .lean();

    const slugWords = normalizedSlugText.split(' ').filter((w) => w.length > 2);
    const uniqueKeywords = slugWords.filter((w) => {
      if (/^\d+$/.test(w)) return true;
      if (w.length >= 4) return true;
      return false;
    });

    let bestMatch = null;
    let bestMatchScore = 0;

    for (const q of allQuestionsInCategory) {
      if (!q.question) continue;

      const normalizedQuestion = normalizeText(q.question);

      let matchScore = 0;

      if (normalizedQuestion === normalizedSlugText) {
        matchScore = 100;
        bestMatch = q;
        bestMatchScore = 100;
        break;
      }

      let keywordMatches = 0;
      if (uniqueKeywords.length > 0) {
        keywordMatches = uniqueKeywords.filter((kw) => normalizedQuestion.includes(kw)).length;
        const keywordRatio = keywordMatches / uniqueKeywords.length;
        matchScore += keywordRatio * 40;
      }

      if (normalizedSlugText.length > 50 && normalizedQuestion.includes(normalizedSlugText)) {
        const score = (normalizedSlugText.length / normalizedQuestion.length) * 50;
        matchScore += score;
      }

      if (normalizedQuestion.length > 50) {
        const questionStart = normalizedQuestion.substring(
          0,
          Math.min(normalizedSlugText.length, normalizedQuestion.length)
        );
        if (
          normalizedSlugText.includes(questionStart) ||
          questionStart === normalizedSlugText.substring(0, questionStart.length)
        ) {
          const score = (questionStart.length / normalizedSlugText.length) * 40;
          matchScore += score;
        }
      }

      if (keywordMatches >= Math.ceil(uniqueKeywords.length * 0.7)) {
        matchScore += 10;
      }

      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestMatch = q;
      }
    }

    const requiredKeywords =
      uniqueKeywords.length > 0 ? Math.ceil(uniqueKeywords.length * 0.7) : 0;
    const bestMatchKeywords =
      bestMatch && uniqueKeywords.length > 0
        ? uniqueKeywords.filter((kw) => normalizeText(bestMatch.question).includes(kw)).length
        : 0;

    if (
      bestMatch &&
      bestMatchScore >= 70 &&
      (uniqueKeywords.length === 0 || bestMatchKeywords >= requiredKeywords)
    ) {
      question = bestMatch;

      if (bestMatch.slug !== sanitizedQuestionId) {
        MCQ.findByIdAndUpdate(bestMatch._id, { slug: sanitizedQuestionId }).catch(() => {});
      }

      return await buildQuestionResponse(question, category, subject, subjectPath);
    }

    question = await MCQ.findOne({
      slug: sanitizedQuestionId,
      categoryId: category._id
    }).lean();

    if (question) {
      return await buildQuestionResponse(question, category, subject, subjectPath);
    }

    const normalizedSlug = sanitizedQuestionId.replace(/-+$/, '').toLowerCase();
    if (normalizedSlug !== sanitizedQuestionId.toLowerCase()) {
      question = await MCQ.findOne({
        slug: { $regex: new RegExp('^' + escapeRegex(normalizedSlug), 'i') },
        categoryId: category._id
      }).lean();

      if (question) {
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject, subjectPath);
      }
    }

    if (sanitizedQuestionId.length > 80) {
      const prefixSlug = sanitizedQuestionId.substring(0, 80).replace(/-+$/, '');

      question = await MCQ.findOne({
        slug: { $regex: new RegExp('^' + escapeRegex(prefixSlug), 'i') },
        categoryId: category._id
      }).lean();

      if (question) {
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject, subjectPath);
      }
    }

    if (/^[0-9a-f]{24}$/i.test(sanitizedQuestionId)) {
      try {
        const objectId = new mongoose.Types.ObjectId(sanitizedQuestionId);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
        if (question) return await buildQuestionResponse(question, category, subject, subjectPath);
      } catch (e) {
        // ignore invalid
      }
    }

    const parts = sanitizedQuestionId.split('-');
    const lastPart = parts[parts.length - 1];

    if (lastPart && lastPart.length === 24 && /^[0-9a-f]{24}$/i.test(lastPart)) {
      try {
        const objectId = new mongoose.Types.ObjectId(lastPart);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
        if (question) return await buildQuestionResponse(question, category, subject, subjectPath);
      } catch (e) {
        // ignore invalid
      }
    }

    if (lastPart && /^[0-9a-f]{8,23}$/i.test(lastPart) && lastPart.length < 24) {
      const allQuestions = await MCQ.find({
        categoryId: category._id
      })
        .select('_id question options answer explanation createdAt slug')
        .lean();

      const idMatches = allQuestions.filter((q) => {
        const idStr = q._id.toString().toLowerCase();
        return idStr.startsWith(lastPart.toLowerCase());
      });

      if (idMatches.length === 0) {
        return { error: 'Question not found', status: 404 };
      }

      if (idMatches.length === 1) {
        question = idMatches[0];

        if (!question.slug && question.question) {
          const newSlug = generateQuestionSlug(question.question);
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
        }

        return await buildQuestionResponse(question, category, subject, subjectPath);
      }

      if (parts.length > 1) {
        const questionTextSlug = parts.slice(0, -1).join('-');
        const questionText = questionTextSlug.replace(/-/g, ' ');

        const allWords = questionText.split(' ').filter((w) => w.length > 2);

        if (allWords.length > 0) {
          let bestMatchMulti = null;
          let maxMatches = 0;

          for (const candidate of idMatches) {
            const matches = allWords.filter((word) =>
              new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(candidate.question)
            ).length;

            if (matches > maxMatches) {
              maxMatches = matches;
              bestMatchMulti = candidate;
            }
          }

          if (bestMatchMulti && maxMatches >= 3) {
            question = bestMatchMulti;

            if (!question.slug && question.question) {
              const newSlug = generateQuestionSlug(question.question);
              MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
            }

            return await buildQuestionResponse(question, category, subject, subjectPath);
          }
        }
      }

      return {
        error: 'Multiple questions found with same ID prefix. Unable to determine correct question.',
        status: 404
      };
    }

    const questionText = sanitizedQuestionId.replace(/-/g, ' ');

    try {
      const generatedSlug = generateQuestionSlug(questionText);

      const slugPrefix = generatedSlug.substring(0, Math.min(80, generatedSlug.length));
      question = await MCQ.findOne({
        categoryId: category._id,
        slug: { $regex: new RegExp('^' + escapeRegex(slugPrefix), 'i') }
      }).lean();

      if (question) {
        MCQ.findByIdAndUpdate(question._id, { slug: sanitizedQuestionId }).catch(() => {});
        return await buildQuestionResponse(question, category, subject, subjectPath);
      }
    } catch (e) {
      // ignore
    }

    const words = questionText.split(' ').filter((w) => w.length > 1 || /^\d+$/.test(w));

    if (words.length > 0) {
      const normalizedText = questionText.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const escapedText = escapeRegex(normalizedText);

      question = await MCQ.findOne({
        categoryId: category._id,
        question: { $regex: new RegExp(escapedText, 'i') }
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!question) {
        const originalEscaped = escapeRegex(questionText);
        question = await MCQ.findOne({
          categoryId: category._id,
          question: { $regex: new RegExp(originalEscaped, 'i') }
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      if (question) {
        if (!question.slug && question.question) {
          const newSlug = generateQuestionSlug(question.question);
          MCQ.findByIdAndUpdate(question._id, { slug: newSlug }).catch(() => {});
        }

        return await buildQuestionResponse(question, category, subject, subjectPath);
      }

      const minWordsToMatch =
        words.length >= 10 ? Math.ceil(words.length * 0.4) : Math.ceil(words.length * 0.5);

      const stopWords = new Set([
        'the',
        'is',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'and',
        'a',
        'an',
        'had',
        'was',
        'were',
        'been',
        'being'
      ]);
      const significantWords = words.filter((w) => !stopWords.has(w.toLowerCase()) && w.length > 2);

      const sortedWords =
        significantWords.length > 0
          ? [...significantWords].sort((a, b) => b.length - a.length)
          : [...words].sort((a, b) => b.length - a.length);
      const primaryWords = sortedWords.slice(0, Math.min(6, sortedWords.length));

      const wordPatterns = primaryWords.map((w) => escapeRegex(w));

      const topWordsForFilter = wordPatterns.slice(0, Math.min(3, wordPatterns.length));
      const filterPattern =
        topWordsForFilter.length > 0 ? '(' + topWordsForFilter.join('|') + ')' : wordPatterns.join('|');

      const allQuestions = await MCQ.find({
        categoryId: category._id,
        question: { $regex: new RegExp(filterPattern, 'i') }
      })
        .select('_id question options answer explanation createdAt slug')
        .limit(100)
        .lean();

      const wordsToMatch = significantWords.length >= minWordsToMatch ? significantWords : words;
      const matchingQuestions = allQuestions.filter((q) => {
        const matches = wordsToMatch.filter((word) =>
          new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
        ).length;
        return matches >= minWordsToMatch;
      });

      if (matchingQuestions.length === 0 && wordsToMatch.length >= 6) {
        const uniqueWords = wordsToMatch.filter((w) => {
          const lower = w.toLowerCase();
          const commonWords = [
            'how',
            'many',
            'what',
            'when',
            'where',
            'who',
            'which',
            'had',
            'has',
            'have',
            'was',
            'were',
            'the',
            'a',
            'an',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'and',
            'or',
            'is',
            'are',
            'off'
          ];
          if (commonWords.includes(lower)) return false;
          if (/^\d+$/.test(w)) return true;
          if (w.length >= 4) return true;
          return false;
        });

        const criticalWords = uniqueWords.filter((w) => {
          const lower = w.toLowerCase();
          if (/^\d+$/.test(w)) return true;
          if (w.length >= 3 && w.length <= 5) return true;
          return w.length >= 6;
        });

        const fallbackThreshold = Math.ceil(wordsToMatch.length * 0.35);
        const minUniqueWords =
          uniqueWords.length >= 6 ? Math.max(4, Math.min(uniqueWords.length, 6)) : Math.max(2, Math.min(uniqueWords.length, 4));
        const minCriticalWords = criticalWords.length > 0 ? Math.max(2, Math.min(criticalWords.length, 4)) : 0;

        const fallbackMatches = allQuestions.filter((q) => {
          const totalMatches = wordsToMatch.filter((word) =>
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
          ).length;

          const uniqueMatches = uniqueWords.filter((word) =>
            new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
          ).length;

          const criticalMatches =
            criticalWords.length > 0
              ? criticalWords.filter((word) =>
                  new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(q.question)
                ).length
              : 0;

          return (
            totalMatches >= fallbackThreshold &&
            uniqueMatches >= minUniqueWords &&
            (criticalWords.length === 0 || criticalMatches >= minCriticalWords)
          );
        });

        if (fallbackMatches.length > 0) {
          fallbackMatches.sort((a, b) => {
            const countMatches = (wordsArr, questionText) =>
              wordsArr.filter((word) => new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(questionText)).length;

            const aCritical = countMatches(criticalWords, a.question);
            const bCritical = countMatches(criticalWords, b.question);
            if (bCritical !== aCritical) return bCritical - aCritical;

            const aUnique = countMatches(uniqueWords, a.question);
            const bUnique = countMatches(uniqueWords, b.question);
            if (bUnique !== aUnique) return bUnique - aUnique;

            const aTotal = countMatches(wordsToMatch, a.question);
            const bTotal = countMatches(wordsToMatch, b.question);
            return bTotal - aTotal;
          });

          const bestMatchFallback = fallbackMatches[0];
          const countMatches = (wordsArr, questionText) =>
            wordsArr.filter((word) => new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(questionText)).length;
          const bestCriticalMatches = countMatches(criticalWords, bestMatchFallback.question);
          const uniqueMatches = countMatches(uniqueWords, bestMatchFallback.question);
          const totalMatches = countMatches(wordsToMatch, bestMatchFallback.question);

          const requiredCritical = Math.ceil(criticalWords.length * 0.7);
          const uniqueWordRatio = uniqueWords.length > 0 ? uniqueMatches / uniqueWords.length : 0;
          const hasHighConfidence =
            criticalWords.length === 0
              ? uniqueWordRatio >= 0.5 && totalMatches >= Math.ceil(wordsToMatch.length * 0.45)
              : bestCriticalMatches >= requiredCritical && uniqueWordRatio >= 0.5;

          if (hasHighConfidence) {
            matchingQuestions.push(bestMatchFallback);
          }
        }
      }

      if (matchingQuestions.length === 1) {
        question = matchingQuestions[0];

        if (question.question) {
          const newSlug =
            question.slug ||
            (await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ));

          if (newSlug !== sanitizedQuestionId) {
            let finalSlug = sanitizedQuestionId;
            const existing = await MCQ.findOne({ slug: finalSlug, categoryId: category._id });
            if (existing && existing._id.toString() !== question._id.toString()) {
              finalSlug = await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ);
            }
            MCQ.findByIdAndUpdate(question._id, { slug: finalSlug }).catch(() => {});
          }
        }

        return await buildQuestionResponse(question, category, subject, subjectPath);
      } else if (matchingQuestions.length > 1) {
        matchingQuestions.sort((a, b) => {
          const countMatches = (questionText) =>
            words.filter((word) => new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(questionText)).length;
          return countMatches(b.question) - countMatches(a.question);
        });

        question = matchingQuestions[0];

        if (question.question) {
          let finalSlug = sanitizedQuestionId;
          const existing = await MCQ.findOne({ slug: finalSlug, categoryId: category._id });
          if (existing && existing._id.toString() !== question._id.toString()) {
            finalSlug = await generateUniqueQuestionSlug(question.question, question._id.toString(), category._id, MCQ);
          }
          MCQ.findByIdAndUpdate(question._id, { slug: finalSlug }).catch(() => {});
        }

        return await buildQuestionResponse(question, category, subject, subjectPath);
      }
    }

    if (!question) {
      return { error: 'Question not found', status: 404 };
    }

    return await buildQuestionResponse(question, category, subject, subjectPath);
  } catch (error) {
    return { error: 'Failed to fetch question', status: 500 };
  }
}

async function generateStructuredData(question, category, subject, subjectPath) {
  const slug = generateQuestionSlug(question.question, question._id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcqsbase.com';
  const subjectPathForUrl = subjectPath || subject;
  const questionUrl = `${baseUrl}/mcqs/${subjectPathForUrl}/question/${slug}`;

  const correctAnswerText =
    question.options.find(
      (opt) => opt.toLowerCase().trim() === question.answer.toLowerCase().trim()
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
          item: `${baseUrl}/mcqs/${subjectPathForUrl}`
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

export async function generateMetadata({ params }) {
  const { subject } = params;
  const rawSegments = Array.isArray(params.subcategory)
    ? params.subcategory
    : typeof params.subcategory === 'string'
      ? [params.subcategory]
      : [];

  const isQuestion = isQuestionRoute(rawSegments);
  const categorySegmentsRaw = isQuestion ? rawSegments.slice(0, -2) : rawSegments;
  const normalizedSegments = normalizeSegments(categorySegmentsRaw);
  const displaySubject = humanize(subject);

  if (isQuestion) {
    const questionId = rawSegments[rawSegments.length - 1];
    const { question, category } = await fetchQuestionData({
      subject,
      questionId,
      subcategorySegments: normalizedSegments
    });

    if (!question || !category) {
      return {
        title: 'Question Not Found | McqsBase.com',
        description: 'The requested question could not be found.'
      };
    }

    const slug = generateQuestionSlug(question.question, question._id);
    const questionPreview =
      question.question.length > 160 ? question.question.substring(0, 157) + '...' : question.question;

    const title = `${questionPreview} - ${category.name} MCQs | McqsBase.com`;
    const description = `Practice ${category.name.toLowerCase()} MCQ question: ${questionPreview}${
      question.explanation ? ' Learn with detailed explanation.' : ''
    } Part of comprehensive MCQ collection for FPSC, SPSC, PPSC, and NTS exams.`;

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

    const { path: subjectPath } = combineSubjectPath(subject, normalizedSegments);
    const safeSubjectPath = subjectPath || subject;
    const url = `/mcqs/${safeSubjectPath}/question/${slug}`;

    return generateSEOMetadata({
      title,
      description,
      keywords,
      url
    });
  }

  const displaySubPath = humanizePath(categorySegmentsRaw);
  const title = displaySubPath
    ? `${displaySubject} - ${displaySubPath} MCQs`
    : `${displaySubject} MCQs`;

  return generateSEOMetadata({
    title,
    description: `Practice ${displaySubPath || displaySubject} MCQs from ${displaySubject} with detailed explanations.`,
    keywords: `${subject} ${categorySegmentsRaw.join(' ')} mcqs`.trim(),
    url: `/mcqs/${[subject, ...categorySegmentsRaw].join('/')}`
  });
}

export default async function SubcategoryPage({ params, searchParams }) {
  const { subject } = params;
  const rawSegments = Array.isArray(params.subcategory)
    ? params.subcategory
    : typeof params.subcategory === 'string'
      ? [params.subcategory]
      : [];

  const isQuestion = isQuestionRoute(rawSegments);
  const categorySegmentsRaw = isQuestion ? rawSegments.slice(0, -2) : rawSegments;
  const normalizedSubject = normalizeCategoryName(subject || '');
  const normalizedSegments = normalizeSegments(categorySegmentsRaw);

  if (!normalizedSubject) {
    notFound();
  }

  if (!isQuestion && normalizedSegments.length === 0) {
    notFound();
  }

  if (isQuestion) {
    const questionId = rawSegments[rawSegments.length - 1];
    const { question, nextQuestionId, prevQuestionId, category, subjectPath, error } = await fetchQuestionData({
      subject,
      questionId,
      subcategorySegments: normalizedSegments
    });

    if (error || !question || !category) {
      notFound();
    }

    const structuredData = await generateStructuredData(question, category, subject, subjectPath);

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
          subjectPath={subjectPath}
          categoryName={category.name}
          nextQuestionId={nextQuestionId}
          prevQuestionId={prevQuestionId}
        />
        <Footer />
      </>
    );
  }

  const pageParam = parseInt(searchParams?.page || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading MCQs…</div>}>
        <SubcategoryMcqs
          subject={normalizedSubject}
          subcategorySegments={normalizedSegments}
          initialPage={page}
        />
      </Suspense>
      <Footer />
    </ReCaptchaProvider>
  );
}

export const dynamic = 'force-dynamic';


