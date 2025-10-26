import mongoose from 'mongoose';

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

const MCQ = mongoose.model('MCQ', mcqSchema);

export default MCQ; 