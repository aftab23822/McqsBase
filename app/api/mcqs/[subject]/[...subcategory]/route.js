import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../lib/mongodb.js';
import MCQ from '../../../../../lib/models/MCQ.js';
import Category from '../../../../../lib/models/Category.js';
import Subcategory from '../../../../../lib/models/Subcategory.js';
import { sanitizeSubject, sanitizeInt, escapeRegex } from '../../../../../lib/utils/security.js';
import { normalizeCategoryName } from '../../../../../src/utils/categoryConfig';

function normalizeSegments(rawSegments) {
  if (!Array.isArray(rawSegments)) {
    return [];
  }
  const normalized = [];
  for (const segment of rawSegments) {
    const norm = normalizeCategoryName(segment || '');
    if (!norm) {
      return [];
    }
    normalized.push(norm);
  }
  return normalized;
}

function buildNullParentFilter() {
  return { $or: [{ parentSubcategoryId: null }, { parentSubcategoryId: { $exists: false } }] };
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;

    const sanitizedSubject = sanitizeSubject(resolvedParams.subject);
    const rawSegments = Array.isArray(resolvedParams.subcategory)
      ? resolvedParams.subcategory
      : typeof resolvedParams.subcategory === 'string'
        ? [resolvedParams.subcategory]
        : [];

    if (!sanitizedSubject || rawSegments.length === 0) {
      return NextResponse.json({ results: [], total: 0, page: 1, totalPages: 0 });
    }

    const normalizedSegments = normalizeSegments(rawSegments);
    if (normalizedSegments.length === 0) {
      return NextResponse.json({ results: [], total: 0, page: 1, totalPages: 0 });
    }

    const { searchParams } = new URL(request.url);
    const page = sanitizeInt(searchParams.get('page'), 1, 1000, 1);
    const limit = sanitizeInt(searchParams.get('limit'), 1, 100, 10);
    const skip = (page - 1) * limit;

    const normalizedSubject = normalizeCategoryName(sanitizedSubject);
    const escapedSubject = escapeRegex(normalizedSubject);
    const category = await Category.findOne({
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') }
    }).lean();

    if (!category) {
      return NextResponse.json({ results: [], total: 0, page, totalPages: 0 });
    }

    let parentSubcategoryId = null;
    let subcategory = null;
    const chain = [];

    for (const segment of normalizedSegments) {
      const escapedSegment = escapeRegex(segment);
      const query = {
        categoryId: category._id,
        name: { $regex: new RegExp('^' + escapedSegment + '$', 'i') }
      };

      if (parentSubcategoryId) {
        query.parentSubcategoryId = parentSubcategoryId;
      } else {
        query.$or = [
          { parentSubcategoryId: null },
          { parentSubcategoryId: { $exists: false } }
        ];
      }

      subcategory = await Subcategory.findOne(query).lean();
      if (!subcategory) {
        return NextResponse.json({ results: [], total: 0, page, totalPages: 0 });
      }

      chain.push({
        _id: subcategory._id.toString(),
        name: subcategory.name,
        slug: segment
      });

      parentSubcategoryId = subcategory._id;
    }

    if (!subcategory) {
      return NextResponse.json({ results: [], total: 0, page, totalPages: 0 });
    }

    const orFilters = [
      { categoryId: category._id, subcategoryId: subcategory._id },
      { subcategoryId: subcategory._id }
    ];

    const lastSegment = normalizedSegments[normalizedSegments.length - 1];
    const escapedLast = escapeRegex(lastSegment);
    const legacyCategory = await Category.findOne({
      name: { $regex: new RegExp('^' + escapedLast + '$', 'i') },
      type: 'MCQ'
    }).lean();

    if (legacyCategory && legacyCategory._id.toString() !== category._id.toString()) {
      orFilters.push({ categoryId: legacyCategory._id });
    }

    const filter = orFilters.length > 1 ? { $or: orFilters } : orFilters[0];

    const [total, mcqs] = await Promise.all([
      MCQ.countDocuments(filter),
      MCQ.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const serialized = mcqs.map(mcq => ({
      ...mcq,
      _id: mcq._id.toString(),
      categoryId: mcq.categoryId?.toString() || mcq.categoryId,
      subcategoryId: mcq.subcategoryId?.toString() || mcq.subcategoryId,
      submittedBy: mcq.submittedBy?.toString() || mcq.submittedBy
    }));

    const formatChildNode = (doc, ancestorSegments) => {
      const slug = normalizeCategoryName(doc.name || '');
      const pathSegments = [...ancestorSegments, slug];
      const fullSlug = [normalizedSubject, ...pathSegments].join('/');
      const matchesPath =
        normalizedSegments.length >= pathSegments.length &&
        pathSegments.every((seg, idx) => normalizedSegments[idx] === seg);

      return {
        _id: doc._id.toString(),
        name: doc.name,
        slug,
        fullSlug,
        pathSegments,
        isActive: matchesPath,
        isCurrent: matchesPath && normalizedSegments.length === pathSegments.length
      };
    };

    const navigationLevels = [];

    const topLevelChildrenDocs = await Subcategory.find({
      categoryId: category._id,
      ...buildNullParentFilter()
    })
      .sort({ name: 1 })
      .lean();

    const topLevelChildren = topLevelChildrenDocs.map(doc => formatChildNode(doc, []));
    if (topLevelChildren.length > 0) {
      navigationLevels.push({
        id: category._id.toString(),
        label: category.name,
        path: normalizedSubject,
        parentPath: null,
        children: topLevelChildren
      });
    }

    const chainWithSegments = chain.map((node, index) => ({
      ...node,
      pathSegments: normalizedSegments.slice(0, index + 1)
    }));

    for (const node of chainWithSegments) {
      const childrenDocs = await Subcategory.find({
        categoryId: category._id,
        parentSubcategoryId: node._id
      })
        .sort({ name: 1 })
        .lean();

      const children = childrenDocs.map(doc => formatChildNode(doc, node.pathSegments));
      navigationLevels.push({
        id: node._id,
        label: node.name,
        path: [normalizedSubject, ...node.pathSegments].join('/'),
        parentPath: node.pathSegments.length > 1
          ? [normalizedSubject, ...node.pathSegments.slice(0, -1)].join('/')
          : normalizedSubject,
        children
      });
    }

    return NextResponse.json({
      results: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      category: {
        _id: category._id.toString(),
        name: category.name,
        type: category.type
      },
      subcategory: {
        _id: subcategory._id.toString(),
        name: subcategory.name,
        chain: chainWithSegments
      },
      navigation: {
        levels: navigationLevels
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`MCQs API error for ${resolvedParams.subject}/${resolvedParams.subcategory}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch MCQs for requested subcategory' },
      { status: 500 }
    );
  }
}


