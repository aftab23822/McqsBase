import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Quiz', 'PastPaper', 'Interview'], required: true }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

export default Category; 