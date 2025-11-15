import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import PastPaper from '../../../../lib/models/PastPaper.js';
import Category from '../../../../lib/models/Category.js';
import { normalizeCategoryName } from '../../../../lib/utils/categoryUtils.js';

// Batch upload Past Papers - saves to PastPaper collection
export async function POST(request) {
  try {
    await connectToDatabase();

    const { mcqs, category: clientCategory } = await request.json();
    const { searchParams } = new URL(request.url);

    console.log('Past Papers batch upload received:', {
      mcqsCount: Array.isArray(mcqs) ? mcqs.length : 0,
      category: clientCategory,
      firstMcq: mcqs?.[0]
    });
    console.log('First 3 questions being uploaded:', mcqs.slice(0, 3).map(m => m.question));

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return NextResponse.json(
        { message: 'No past paper questions provided' },
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
      categoryName = 'uncategorized-past-papers';
    }

    // Find or create the category (type should be PastPaper, but can fallback to MCQ)
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = new Category({ name: categoryName, type: 'PastPaper' });
      await category.save();
    }

    // Deduplication: get all existing questions for this category
    const existingQuestions = new Set(
      (await PastPaper.find({ categoryId: category._id }, 'question')).map(q => q.question)
    );

    console.log('Existing past paper questions count:', existingQuestions.size);
    console.log('Sample existing questions:', Array.from(existingQuestions).slice(0, 3));

    // Import slug generator
    const { generateUniqueQuestionSlug } = await import('../../../../lib/utils/slugGenerator.js');
    
    // Prepare Past Papers for insertion, skip duplicates
    const docsWithSlugs = await Promise.all(
      mcqs.filter(m => !existingQuestions.has(m.question)).map(async (m) => {
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
        
        // Generate unique slug for this question
        const slug = await generateUniqueQuestionSlug(m.question, null, category._id, PastPaper);
        
        // Parse year - handle both string and number formats
        let parsedYear = null;
        if (m.year) {
          if (typeof m.year === 'string' && m.year.trim() !== '') {
            const yearNum = parseInt(m.year.trim(), 10);
            parsedYear = isNaN(yearNum) ? null : yearNum;
          } else if (typeof m.year === 'number') {
            parsedYear = m.year;
          }
        }
        
        // Parse department - handle string format
        const parsedDepartment = m.department && typeof m.department === 'string' && m.department.trim() !== '' 
          ? m.department.trim() 
          : null;

        // Extract commission and role from category path if available
        let commission = null;
        let role = null;
        if (clientCategory && typeof clientCategory === 'string') {
          // Category could be in format: /past-papers/commission/department/role or just the path part
          const categoryStr = clientCategory.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
          const pathParts = categoryStr.split('/').filter(Boolean);
          
          // Check if it starts with past-papers
          if (pathParts.length > 0 && pathParts[0] === 'past-papers') {
            // Format: past-papers/commission/department/role
            if (pathParts.length > 1) commission = pathParts[1];
            if (pathParts.length > 3) role = pathParts[3];
          } else if (pathParts.length >= 3) {
            // Format: commission/department/role (without past-papers prefix)
            commission = pathParts[0];
            role = pathParts[2];
          }
        }
        
        return {
          question: m.question,
          options: optionsToSave,
          answer: normalizedAnswer,
          explanation: m.explanation || '',
          categoryId: category._id,
          link: m.detail_link,
          submittedBy: m.submitter || 'Admin',
          pageOrder: m.pageOrder || 0,
          slug: slug,
          year: parsedYear,
          department: parsedDepartment,
          commission: commission,
          role: role
        };
      })
    );
    
    const docs = docsWithSlugs;

    console.log('Prepared past paper docs for insertion:', {
      count: docs.length,
      sample: docs[0],
      categoryId: category._id
    });

    let insertedCount = 0;
    if (docs.length > 0) {
      try {
        const result = await PastPaper.insertMany(docs, { ordered: false });
        console.log('PastPaper insertMany result:', result);
        insertedCount = Array.isArray(result) ? result.length : 0;
        console.log('Successfully inserted past papers:', insertedCount, 'documents');
      } catch (insertError) {
        console.error('PastPaper insert error:', insertError);
        // insertMany returns partial results on error when ordered: false
        if (insertError.insertedIds) {
          insertedCount = Object.keys(insertError.insertedIds).length;
          console.log('Partially inserted past papers:', insertedCount, 'documents');
          console.log('Write errors:', insertError.writeErrors);
        }
        throw insertError;
      }
    }

    console.log('Past Papers batch upload results:', {
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
    console.error('Error batch uploading past papers:', error);
    return NextResponse.json(
      { message: 'Error batch uploading past papers', error: error.message },
      { status: 500 }
    );
  }
}

