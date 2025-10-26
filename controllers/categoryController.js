import Category from '../models/category.js';

// Get all Categories (paginated)
export const getCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await Category.countDocuments();
  const categories = await Category.find().skip(skip).limit(limit);
  res.json({
    results: categories,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new Category
export const addCategory = async (req, res) => {
  const category = new Category(req.body);
  await category.save();
  res.status(201).json(category);
};

// Update a Category
export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

// Delete a Category
export const deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
}; 