import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastInterview from '@/lib/models/PastInterview.js';

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const update = {};
    if (body.interviewTitle !== undefined) update.interviewTitle = body.interviewTitle;
    if (body.description !== undefined) update.description = body.description;
    if (body.year !== undefined) update.year = parseInt(body.year, 10) || null;
    if (body.department !== undefined) update.department = body.department;
    if (body.position !== undefined) update.position = body.position;
    if (body.sharedBy !== undefined) update.sharedBy = body.sharedBy;
    if (body.experience !== undefined) update.experience = body.experience;

    const doc = await PastInterview.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { ...doc, _id: doc._id.toString() } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin update interview error:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating interview', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await PastInterview.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin delete interview error:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting interview', error: error.message },
      { status: 500 }
    );
  }
}

