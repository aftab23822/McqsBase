import { NextResponse } from 'next/server';
import { findPastPaperQuestion } from '@/lib/services/pastPaperQuestion.js';

/**
 * GET - Fetch a single past paper question by category path and question slug
 * URL: /api/pastpapers/question/[commission]/[department]/[role]/[...subcategory]/question/[questionSlug]
 * The lookup is shared with the server-rendered question page.
 */
export async function GET(request, { params }) {
  try {
    const { path } = await params;
    const pathArray = Array.isArray(path) ? path : (path ? [path] : []);

    if (pathArray.length < 4) {
      return NextResponse.json(
        { error: 'Invalid path. Expected: commission/department/role/question/slug' },
        { status: 400 }
      );
    }
    if (pathArray[pathArray.length - 2] !== 'question') {
      return NextResponse.json(
        { error: 'Invalid path format. Expected: .../question/slug' },
        { status: 400 }
      );
    }

    const result = await findPastPaperQuestion(pathArray.slice(0, -2), pathArray[pathArray.length - 1]);
    if (result.notFound) {
      return NextResponse.json({ error: result.notFound }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching past paper question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}
