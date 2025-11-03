import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastInterview from '@/lib/models/PastInterview.js';
import Category from '@/lib/models/Category.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';

// Add a new Past Interview
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      question,
      answer,
      detail_link,
      submitter,
      sharedBy,
      explanation,
      categoryId,
      category, // Category name
      year,
      department,
      position,
      experience,
      organization
    } = body;

    // Handle category mapping
    let finalCategoryId = categoryId;
    if (!finalCategoryId && category) {
      const normalizedCategoryName = normalizeCategoryName(category);
      let categoryDoc = await Category.findOne({ 
        name: normalizedCategoryName,
        type: 'Interview' 
      });
      if (!categoryDoc) {
        categoryDoc = new Category({ name: normalizedCategoryName, type: 'Interview' });
        await categoryDoc.save();
      }
      finalCategoryId = categoryDoc._id;
    }
    
    // If still no category ID, use default based on department
    if (!finalCategoryId) {
      // Try to find a category based on department (FPSC, SPSC, etc.)
      let defaultCategoryName = 'general';
      if (department) {
        const normalizedDept = department.toLowerCase().trim();
        if (normalizedDept.includes('fpsc')) {
          defaultCategoryName = 'fpsc';
        } else if (normalizedDept.includes('spsc')) {
          defaultCategoryName = 'spsc';
        } else if (normalizedDept.includes('ppsc')) {
          defaultCategoryName = 'ppsc';
        } else if (normalizedDept.includes('nts')) {
          defaultCategoryName = 'nts';
        }
      }
      
      let defaultCategory = await Category.findOne({ 
        name: defaultCategoryName,
        type: 'Interview' 
      });
      if (!defaultCategory) {
        defaultCategory = new Category({ name: defaultCategoryName, type: 'Interview' });
        await defaultCategory.save();
      }
      finalCategoryId = defaultCategory._id;
    }

    // Check for duplicate question in the same category
    const existingInterview = await PastInterview.findOne({ 
      question: question,
      categoryId: finalCategoryId 
    });
    
    if (existingInterview) {
      return NextResponse.json({ 
        message: 'Question already exists in this category',
        existingInterview: existingInterview
      }, { status: 409 });
    }

    const pastInterview = new PastInterview({
      question,
      answer: answer || explanation || '',
      categoryId: finalCategoryId,
      position: position || '',
      organization: organization || department || '',
      department: department || '',
      sharedBy: sharedBy || submitter || '',
      experience: experience || '',
      year: year ? parseInt(year) : new Date().getFullYear(),
      // Note: explanation and detail_link are not in the schema but we can add them if needed
    });

    await pastInterview.save();
    
    return NextResponse.json({
      success: true,
      message: 'Past interview added successfully',
      data: pastInterview
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding Past Interview:', error);
    return NextResponse.json(
      { 
        message: 'Error adding Past Interview', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

