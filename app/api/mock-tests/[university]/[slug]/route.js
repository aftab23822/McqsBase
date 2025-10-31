import connectToDatabase from '../../../../../lib/mongodb';
import MockTest from '../../../../../models/mockTest';

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const { university, slug } = params;
    const test = await MockTest.findOne({ universitySlug: university, slug });
    if (!test) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: test });
  } catch (error) {
    console.error('Error fetching mock test:', error);
    return Response.json({ success: false, message: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { university, slug } = params;
    const body = await request.json();
    const { mockTestName, durationMinutes, questions } = body;

    const update = {};
    if (typeof mockTestName === 'string' && mockTestName.trim()) update.name = mockTestName.trim();
    if (typeof durationMinutes === 'number') update.durationMinutes = durationMinutes;
    if (Array.isArray(questions)) update.questions = questions;
    if (Object.keys(update).length === 0) {
      return Response.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }
    update.lastUpdatedAt = new Date();

    const updated = await MockTest.findOneAndUpdate(
      { universitySlug: university, slug },
      { $set: update },
      { new: true }
    );
    if (!updated) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating mock test:', error);
    return Response.json({ success: false, message: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await connectToDatabase();
    const { university, slug } = params;
    const res = await MockTest.deleteOne({ universitySlug: university, slug });
    if (res.deletedCount === 0) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting mock test:', error);
    return Response.json({ success: false, message: 'Failed to delete test' }, { status: 500 });
  }
}


