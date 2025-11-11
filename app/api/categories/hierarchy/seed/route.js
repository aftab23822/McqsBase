import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import connectToDatabase from '@/lib/mongodb.js';
import Category from '@/lib/models/Category.js';
import Subcategory from '@/lib/models/Subcategory.js';
import { normalizeCategoryName } from '@/utils/categoryConfig';
import { withAdminAuth } from '@/lib/middleware/auth.js';

async function handler(request) {
  try {
    await connectToDatabase();

    // Accept JSON payload from client or fallback to local file
    let categories = [];
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        if (body && Array.isArray(body.categories)) {
          categories = body.categories;
        }
      }
    } catch {}

    if (!Array.isArray(categories) || categories.length === 0) {
      const filePath = path.join(process.cwd(), 'categories_data.json');
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      categories = Array.isArray(parsed?.categories) ? parsed.categories : [];
    }

    const normalizeUrlKey = (url) => {
      if (!url || typeof url !== 'string') return '';
      try {
        const parsed = new URL(url);
        return parsed.pathname.replace(/\/+$/, '');
      } catch {
        return url.replace(/\/+$/, '');
      }
    };

    const categoryLookupByUrl = new Map();
    for (const item of categories) {
      const key = normalizeUrlKey(item?.url);
      if (key) {
        categoryLookupByUrl.set(key, item);
      }
    }

    let createdCategories = 0;
    let createdSubcategories = 0;
    let updatedSubcategories = 0;
    let skippedSubcategories = 0;
    let skippedInvalidNames = 0;

    const processedUrlKeys = new Set();

    const resolveNestedChildren = (sc) => {
      const directNested = Array.isArray(sc?.sub_categories) ? sc.sub_categories : [];
      if (directNested.length > 0) return directNested;

      const lookupKey = normalizeUrlKey(sc?.url);
      if (!lookupKey || processedUrlKeys.has(lookupKey)) {
        return [];
      }

      const mapped = categoryLookupByUrl.get(lookupKey);
      if (mapped && Array.isArray(mapped.sub_categories) && mapped.sub_categories.length > 0) {
        processedUrlKeys.add(lookupKey);
        return mapped.sub_categories;
      }
      return [];
    };

    const processSubcategories = async (items, category, parentId = null) => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      const seen = new Set();

      for (const sc of items) {
        const rawScName = (sc?.name || '').trim();
        let derivedFromUrl = '';
        if (!rawScName && typeof sc?.url === 'string') {
          try {
            const u = new URL(sc.url);
            const parts = u.pathname.split('/').filter(Boolean);
            derivedFromUrl = parts[parts.length - 1] || '';
          } catch {}
        }

        const baseName = rawScName || derivedFromUrl;
        const normalizedScSlug = normalizeCategoryName(baseName);
        if (!normalizedScSlug) {
          skippedInvalidNames += 1;
          continue;
        }

        if (seen.has(normalizedScSlug)) {
          skippedSubcategories += 1;
          continue;
        }
        seen.add(normalizedScSlug);

        const query = {
          categoryId: category._id,
          name: { $regex: new RegExp('^' + normalizedScSlug + '$', 'i') }
        };

        if (parentId) {
          query.parentSubcategoryId = parentId;
        } else {
          query.$or = [
            { parentSubcategoryId: null },
            { parentSubcategoryId: { $exists: false } }
          ];
        }

        let subDoc = await Subcategory.findOne(query);

        if (!subDoc) {
          subDoc = new Subcategory({
            name: normalizedScSlug,
            categoryId: category._id,
            parentSubcategoryId: parentId,
            type: 'MCQ'
          });
          await subDoc.save();
          createdSubcategories += 1;
        } else {
          let needsUpdate = false;
          if (parentId) {
            if (!subDoc.parentSubcategoryId || subDoc.parentSubcategoryId.toString() !== parentId.toString()) {
              subDoc.parentSubcategoryId = parentId;
              needsUpdate = true;
            }
          } else if (subDoc.parentSubcategoryId) {
            subDoc.parentSubcategoryId = null;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await subDoc.save();
            updatedSubcategories += 1;
          } else {
            skippedSubcategories += 1;
          }
        }

        const nested = resolveNestedChildren(sc);
        if (nested.length > 0) {
          await processSubcategories(nested, category, subDoc._id);
        }
      }
    };

    for (const item of categories) {
      const rawName = item?.name || item?.slug || '';
      if (!rawName) continue;

      const normalizedCategory = normalizeCategoryName(rawName);

      let category = await Category.findOne({
        name: { $regex: new RegExp('^' + normalizedCategory + '$', 'i') }
      });

      if (!category) {
        category = new Category({
          name: normalizedCategory,
          type: 'MCQ'
        });
        await category.save();
        createdCategories += 1;
      }

      await processSubcategories(item?.sub_categories, category, null);
    }

    return NextResponse.json({
      ok: true,
      createdCategories,
      createdSubcategories,
      updatedSubcategories,
      skippedSubcategories,
      skippedInvalidNames
    });
  } catch (error) {
    console.error('Seed hierarchy error:', error);
    return NextResponse.json({ error: 'Failed to seed hierarchy' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const POST = withAdminAuth(handler);


