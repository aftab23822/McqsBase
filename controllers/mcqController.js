import MCQ from '../models/mcq.js';
import Category from '../models/category.js';
import { normalizeCategoryName } from '../utils/categoryUtils.js';

// Get all MCQs (paginated)
export const getMcqs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await MCQ.countDocuments();
  const mcqs = await MCQ.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: mcqs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new MCQ
export const addMcq = async (req, res) => {
  try {
    // Map incoming fields to model fields
    const {
      question,
      options,
      correct_option,
      detail_link,
      submitter,
      explanation,
      categoryId,
      subcategoryId,
      category // Add support for category name
    } = req.body;

    // Handle category mapping
    let finalCategoryId = categoryId;
    if (category && !categoryId) {
      const normalizedCategoryName = normalizeCategoryName(category);
      let categoryDoc = await Category.findOne({ name: normalizedCategoryName });
      if (!categoryDoc) {
        categoryDoc = new Category({ name: normalizedCategoryName, type: 'MCQ' });
        await categoryDoc.save();
      }
      finalCategoryId = categoryDoc._id;
    }

    // Check for duplicate question in the same category
    const existingQuestion = await MCQ.findOne({ 
      question: question,
      categoryId: finalCategoryId 
    });
    
    if (existingQuestion) {
      return res.status(409).json({ 
        message: 'Question already exists in this category',
        existingMcq: existingQuestion
      });
    }

    const mcq = new MCQ({
      question,
      options,
      answer: correct_option,
      explanation,
      categoryId: finalCategoryId,
      subcategoryId,
      link: detail_link,
      submittedBy: submitter
    });
    await mcq.save();
    res.status(201).json(mcq);
  } catch (error) {
    console.error('Error adding MCQ:', error);
    res.status(500).json({ message: 'Error adding MCQ', error: error.message });
  }
};

// Update an MCQ
export const updateMcq = async (req, res) => {
  // Map incoming fields to model fields
  const {
    question,
    options,
    correct_option,
    detail_link,
    submitter,
    explanation,
    categoryId,
    subcategoryId
  } = req.body;

  const update = {
    question,
    options,
    answer: correct_option,
    explanation,
    categoryId,
    subcategoryId,
    link: detail_link,
    submittedBy: submitter
  };

  // Remove undefined fields
  Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

  const mcq = await MCQ.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(mcq);
};

// Delete an MCQ
export const deleteMcq = async (req, res) => {
  await MCQ.findByIdAndDelete(req.params.id);
  res.json({ message: 'MCQ deleted' });
};

export const getMcqsBySubject = async (req, res) => {
  const { subject } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Find the category by name (case-insensitive)
  const category = await Category.findOne({ name: { $regex: new RegExp('^' + subject + '$', 'i') } });
  if (!category) {
    return res.json({ results: [], total: 0, page, totalPages: 0 });
  }
  const filter = { categoryId: category._id };
  const total = await MCQ.countDocuments(filter);
  const mcqs = await MCQ.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: mcqs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Batch upload MCQs
export const batchUploadMcqs = async (req, res) => {
  const { mcqs, category: clientCategory } = req.body;
  if (!Array.isArray(mcqs) || mcqs.length === 0) {
    return res.status(400).json({ message: 'No MCQs provided' });
  }

  // Prefer category sent by client, then req.query, then fallback to detail_link
  let categoryName = null;
  if (clientCategory) {
    categoryName = normalizeCategoryName(clientCategory);
  } else if (req.query.category) {
    categoryName = normalizeCategoryName(req.query.category);
  } else if (mcqs[0].detail_link) {
    const match = mcqs[0].detail_link.match(/pakmcqs\.com\/([^\/]+)/);
    if (match) categoryName = normalizeCategoryName(match[1]);
  }
  if (!categoryName) {
    categoryName = 'uncategorized';
  }

  // Find or create the category
  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = new Category({ name: categoryName, type: 'MCQ' });
    await category.save();
  }

  // Deduplication: get all existing questions for this category
  const existingQuestions = new Set(
    (await MCQ.find({ categoryId: category._id }, 'question')).map(q => q.question)
  );

  // Prepare MCQs for insertion (latest at top), skip duplicates
  const docs = mcqs.filter(m => !existingQuestions.has(m.question)).map(m => ({
    question: m.question,
    options: m.options,
    answer: m.correct_option,
    explanation: m.explanation || '',
    categoryId: category._id,
    link: m.detail_link,
    submittedBy: m.submitter,
    pageOrder: m.pageOrder || 0  // Include page order
  }));

  let inserted = [];
  if (docs.length > 0) {
    inserted = await MCQ.insertMany(docs, { ordered: false });
  }
  res.status(201).json({ inserted: inserted.length, skipped: mcqs.length - docs.length });
}; 