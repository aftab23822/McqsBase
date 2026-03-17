import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastPaper from '@/lib/models/PastPaper.js';

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const update = {};
    if (body.question !== undefined) update.question = body.question;
    if (body.explanation !== undefined) update.explanation = body.explanation;
    if (body.answer !== undefined) update.answer = body.answer;
    if (body.options !== undefined) update.options = body.options;
    if (body.year !== undefined) update.year = parseInt(body.year, 10) || null;
    if (body.department !== undefined) update.department = body.department;
    if (body.role !== undefined) update.role = body.role;
    if (body.commission !== undefined) update.commission = body.commission;
    if (body.link !== undefined) update.link = body.link;

    const doc = await PastPaper.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Past Paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { ...doc, _id: doc._id.toString() } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin update Past Paper error:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating Past Paper', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await PastPaper.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Past Paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin delete Past Paper error:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting Past Paper', error: error.message },
      { status: 500 }
    );
  }
}

