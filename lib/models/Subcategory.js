import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Parent top-level category
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  // Optional nesting support for sub-subcategories and deeper
  parentSubcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
  // Optional content type to filter per area (e.g., MCQ or Quiz)
  type: { type: String, enum: ['MCQ', 'Quiz', 'PastPaper', 'Interview'], default: 'MCQ' }
}, { timestamps: true });

export default mongoose.models.Subcategory || mongoose.model('Subcategory', subcategorySchema);


