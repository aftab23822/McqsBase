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


