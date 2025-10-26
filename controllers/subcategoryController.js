import Subcategory from '../models/subcategory.js';

// Get all Subcategories (paginated)
export const getSubcategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await Subcategory.countDocuments();
  const subcategories = await Subcategory.find().skip(skip).limit(limit);
  res.json({
    results: subcategories,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new Subcategory
export const addSubcategory = async (req, res) => {
  const subcategory = new Subcategory(req.body);
  await subcategory.save();
  res.status(201).json(subcategory);
};

// Update a Subcategory
export const updateSubcategory = async (req, res) => {
  const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(subcategory);
};

// Delete a Subcategory
export const deleteSubcategory = async (req, res) => {
  await Subcategory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Subcategory deleted' });
}; 