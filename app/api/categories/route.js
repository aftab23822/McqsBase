import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Category from '../../../lib/models/Category.js';

// Get all Categories (paginated) - matches your existing categoryController.getCategories
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const total = await Category.countDocuments();
    const categories = await Category.find()
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      results: categories,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Add a new Category - matches your existing categoryController.addCategory
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const category = new Category(body);
    await category.save();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json(
      { message: 'Error adding category', error: error.message },
      { status: 500 }
    );
  }
}
