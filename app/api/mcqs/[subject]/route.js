import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import Subcategory from '../../../../lib/models/Subcategory.js';
import { sanitizeSubject, sanitizeInt, escapeRegex } from '../../../../lib/utils/security.js';
import { normalizeCategoryName } from '../../../../src/utils/categoryConfig';

function buildTree(subcategories) {
  const idToNode = new Map();
  const roots = [];

  for (const sc of subcategories) {
    idToNode.set(sc._id.toString(), { ...sc, children: [] });
  }
  for (const sc of subcategories) {
    const node = idToNode.get(sc._id.toString());
    if (sc.parentSubcategoryId) {
      const parent = idToNode.get(sc.parentSubcategoryId.toString());
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  const assignPaths = (node, parentPath = '', depth = 0) => {
    node.fullSlug = parentPath ? `${parentPath}/${node.slug}` : node.slug;
    node.depth = depth;
    node.children.forEach(child => assignPaths(child, node.fullSlug, depth + 1));
  };

  roots.forEach(root => assignPaths(root, '', 0));
  return roots;
}

// Get MCQs by subject - matches your existing mcqController.getMcqsBySubject
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;

    // Sanitize and validate subject parameter
    const sanitizedSubject = sanitizeSubject(resolvedParams.subject);
    if (!sanitizedSubject) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        page: 1, 
        totalPages: 0 
      });
    }

    const { searchParams } = new URL(request.url);
    const page = sanitizeInt(searchParams.get('page'), 1, 1000, 1);
    const limit = sanitizeInt(searchParams.get('limit'), 1, 100, 10);
    const skip = (page - 1) * limit;
    const includeHierarchy = (searchParams.get('include') || '').toLowerCase().includes('hierarchy');

    // Find the category by name (case-insensitive) - using escaped regex for security
    const normalized = normalizeCategoryName(sanitizedSubject);
    const escapedSubject = escapeRegex(normalized);
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') } 
    }).lean(); // Use lean() for faster category lookup
    
    if (!category) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        page, 
        totalPages: 0 
      });
    }

    const filter = { categoryId: category._id };
    
    // Parallelize database queries for better performance
    const [total, mcqs] = await Promise.all([
      MCQ.countDocuments(filter),
      MCQ.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for faster queries (returns plain JS objects)
    ]);

    // Convert ObjectIds to strings for Client Components
    const serializedMcqs = mcqs.map(mcq => ({
      ...mcq,
      _id: mcq._id.toString(),
      categoryId: mcq.categoryId?.toString() || mcq.categoryId,
      submittedBy: mcq.submittedBy?.toString() || mcq.submittedBy
    }));

    let hierarchy = undefined;
    if (includeHierarchy) {
      const allSubcategories = await Subcategory.find({ categoryId: category._id })
        .select({ name: 1, categoryId: 1, parentSubcategoryId: 1, type: 1 })
        .lean();

      const subcategories = allSubcategories.map(sc => ({
        ...sc,
        slug: normalizeCategoryName(sc.name || '')
      }));
      const tree = buildTree(subcategories);
      const slugMap = new Map();
      const stack = [...tree];
      while (stack.length > 0) {
        const node = stack.pop();
        if (node) {
          slugMap.set(node._id.toString(), node.fullSlug);
          if (Array.isArray(node.children) && node.children.length > 0) {
            node.children.forEach(child => stack.push(child));
          }
        }
      }
      hierarchy = {
        category: {
          _id: category._id.toString(),
          name: category.name,
          type: category.type
        },
        subcategories: subcategories.map(sc => ({
          ...sc,
          _id: sc._id.toString(),
          categoryId: sc.categoryId?.toString() || sc.categoryId,
          parentSubcategoryId: sc.parentSubcategoryId?.toString() || sc.parentSubcategoryId,
          fullSlug: slugMap.get(sc._id.toString()) || sc.slug
        })),
        tree
      };
    }

    return NextResponse.json({
      results: serializedMcqs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      ...(hierarchy ? { hierarchy } : {})
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`MCQs API error for subject ${resolvedParams.subject}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${resolvedParams.subject} MCQs` },
      { status: 500 }
    );
  }
}
