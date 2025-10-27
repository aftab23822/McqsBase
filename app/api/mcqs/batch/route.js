import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { normalizeCategoryName } from '../../../../lib/utils/categoryUtils.js';

// Batch upload MCQs - matches your existing mcqController.batchUploadMcqs
export async function POST(request) {
  try {
    await connectToDatabase();

    const { mcqs, category: clientCategory } = await request.json();
    const { searchParams } = new URL(request.url);

    console.log('Batch upload received:', {
      mcqsCount: Array.isArray(mcqs) ? mcqs.length : 0,
      category: clientCategory,
      firstMcq: mcqs?.[0]
    });
    console.log('First 3 questions being uploaded:', mcqs.slice(0, 3).map(m => m.question));

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return NextResponse.json(
        { message: 'No MCQs provided' },
        { status: 400 }
      );
    }

    // Prefer category sent by client, then req.query, then fallback to detail_link
    let categoryName = null;
    if (clientCategory) {
      categoryName = normalizeCategoryName(clientCategory);
    } else if (searchParams.get('category')) {
      categoryName = normalizeCategoryName(searchParams.get('category'));
    } else if (mcqs[0].detail_link) {
      const match = mcqs[0].detail_link.match(/pakmcqs\.com\/([^\/]+)/);
      if (match) categoryName = normalizeCategoryName(match[1]);
    }
    if (!categoryName) {
      categoryName = 'uncategorized';
    }

    // Find or create the category
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = new Category({ name: categoryName, type: 'MCQ' });
      await category.save();
    }

    // Deduplication: get all existing questions for this category
    const existingQuestions = new Set(
      (await MCQ.find({ categoryId: category._id }, 'question')).map(q => q.question)
    );

    console.log('Existing questions count:', existingQuestions.size);
    console.log('Sample existing questions:', Array.from(existingQuestions).slice(0, 3));

    // Prepare MCQs for insertion (latest at top), skip duplicates
    const docs = mcqs.filter(m => !existingQuestions.has(m.question)).map(m => {
      // Convert options object to array format if needed
      let optionsToSave = m.options;
      if (m.options && typeof m.options === 'object' && !Array.isArray(m.options)) {
        // Convert {A: "...", B: "...", C: "...", D: "...", E: "..."} to array
        optionsToSave = Object.values(m.options);
      }
      
      // Filter out empty strings from options array
      if (Array.isArray(optionsToSave)) {
        optionsToSave = optionsToSave.filter(opt => opt && opt.trim() !== '');
      }
      
      // Convert answer from letter (A, B, C, D, E) to the actual option text
      let normalizedAnswer = m.correct_option;
      if (typeof normalizedAnswer === 'string') {
        normalizedAnswer = normalizedAnswer.toUpperCase().trim();
        
        // If answer is a letter (A, B, C, D, E), convert it to the option text
        if (['A', 'B', 'C', 'D', 'E'].includes(normalizedAnswer)) {
          const optionIndex = normalizedAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
          if (optionsToSave[optionIndex]) {
            normalizedAnswer = optionsToSave[optionIndex];
          }
        }
        // If answer is already the full text, keep it as is
      }
      
      return {
        question: m.question,
        options: optionsToSave,
        answer: normalizedAnswer,
        explanation: m.explanation || '',
        categoryId: category._id,
        link: m.detail_link,
        submittedBy: m.submitter || 'Admin',
        pageOrder: m.pageOrder || 0
      };
    });

    console.log('Prepared docs for insertion:', {
      count: docs.length,
      sample: docs[0],
      categoryId: category._id
    });

    let insertedCount = 0;
    if (docs.length > 0) {
      try {
        const result = await MCQ.insertMany(docs, { ordered: false });
        console.log('insertMany result:', result);
        console.log('result type:', typeof result);
        console.log('result length:', result?.length);
        insertedCount = Array.isArray(result) ? result.length : 0;
        console.log('Successfully inserted:', insertedCount, 'documents');
      } catch (insertError) {
        console.error('Insert error:', insertError);
        // insertMany returns partial results on error when ordered: false
        if (insertError.insertedIds) {
          insertedCount = Object.keys(insertError.insertedIds).length;
          console.log('Partially inserted:', insertedCount, 'documents');
          console.log('Write errors:', insertError.writeErrors);
        }
        throw insertError;
      }
    }

    console.log('Batch upload results:', {
      totalReceived: mcqs.length,
      afterDedup: docs.length,
      inserted: insertedCount,
      skipped: mcqs.length - docs.length
    });

    return NextResponse.json({ 
      inserted: insertedCount, 
      skipped: mcqs.length - docs.length 
    }, { status: 201 });
  } catch (error) {
    console.error('Error batch uploading MCQs:', error);
    return NextResponse.json(
      { message: 'Error batch uploading MCQs', error: error.message },
      { status: 500 }
    );
  }
}
