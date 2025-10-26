import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Quiz', 'PastPaper', 'Interview'], required: true }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
