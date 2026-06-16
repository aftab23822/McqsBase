import connectToDatabase from '../mongodb.js';
import Blog from '../models/Blog.js';
import { sanitizeString } from '../utils/security.js';

export function normalizeBlogSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

export function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((keyword) => sanitizeString(keyword, 80))
      .filter(Boolean)
      .slice(0, 30);
  }

  return sanitizeString(value || '', 1000)
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function serializeBlog(blog) {
  if (!blog) return null;
  const obj = typeof blog.toObject === 'function' ? blog.toObject() : blog;
  return {
    ...obj,
    _id: String(obj._id),
    createdBy: obj.createdBy ? String(obj.createdBy) : null,
    updatedBy: obj.updatedBy ? String(obj.updatedBy) : null,
    createdAt: obj.createdAt?.toISOString?.() || obj.createdAt,
    updatedAt: obj.updatedAt?.toISOString?.() || obj.updatedAt,
    publishedAt: obj.publishedAt?.toISOString?.() || obj.publishedAt
  };
}

export function cleanBlogPayload(body = {}) {
  const seoUri = normalizeBlogSlug(body.seoUri || body.slug || body.title || '');
  return {
    title: sanitizeString(body.title || '', 220),
    excerpt: sanitizeString(body.excerpt || '', 500),
    category: sanitizeString(body.category || 'Exam Guide', 80),
    body: sanitizeString(body.body || body.content || '', 100000),
    seoTitle: sanitizeString(body.seoTitle || body.title || '', 220),
    primaryKeyword: sanitizeString(body.primaryKeyword || '', 160),
    seoUri,
    metaDescription: sanitizeString(body.metaDescription || body.excerpt || '', 320),
    seoKeywords: normalizeKeywords(body.seoKeywords),
    status: body.status === 'draft' ? 'draft' : 'published',
    author: sanitizeString(body.author || 'McqsBase Team', 100)
  };
}

export async function listPublishedBlogs(limit = 100) {
  await connectToDatabase();
  const blogs = await Blog.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return blogs.map(serializeBlog);
}

export async function getPublishedBlogBySlug(slug) {
  await connectToDatabase();
  const normalizedSlug = normalizeBlogSlug(slug);
  if (!normalizedSlug) return null;
  const blog = await Blog.findOne({ seoUri: normalizedSlug, status: 'published' }).lean();
  return serializeBlog(blog);
}

export async function listAdminBlogs({ page = 1, limit = 20, status, search } = {}) {
  await connectToDatabase();
  const query = {};
  if (['draft', 'published'].includes(status)) {
    query.status = status;
  }
  if (search) {
    const escaped = sanitizeString(search, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { seoUri: { $regex: escaped, $options: 'i' } },
      { primaryKeyword: { $regex: escaped, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    Blog.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Blog.countDocuments(query)
  ]);

  return {
    blogs: blogs.map(serializeBlog),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
}

export async function createBlog(payload, userId) {
  await connectToDatabase();
  const clean = cleanBlogPayload(payload);
  const blog = await Blog.create({
    ...clean,
    createdBy: userId || null,
    updatedBy: userId || null
  });
  return serializeBlog(blog);
}

export async function updateBlog(id, payload, userId) {
  await connectToDatabase();
  const clean = cleanBlogPayload(payload);
  const update = {
    ...clean,
    updatedBy: userId || null,
    publishedAt: clean.status === 'published' ? new Date() : null
  };

  const blog = await Blog.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  return serializeBlog(blog);
}

export async function deleteBlog(id) {
  await connectToDatabase();
  const blog = await Blog.findByIdAndDelete(id);
  return serializeBlog(blog);
}
