import mongoose from 'mongoose';
import connectToDatabase from '../mongodb.js';

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
  explanation: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  link: { type: String },
  submittedBy: { type: String },
  pageOrder: { type: Number, default: 0 }  // Track order within page
}, { timestamps: true });

// Prevent re-compilation during development
export default mongoose.models.MCQ || mongoose.model('MCQ', mcqSchema);
