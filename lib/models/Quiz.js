import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
