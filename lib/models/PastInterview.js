import mongoose from 'mongoose';

const pastInterviewSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  position: { type: String },
  organization: { type: String },
  year: { type: Number }
}, { timestamps: true });

export default mongoose.models.PastInterview || mongoose.model('PastInterview', pastInterviewSchema);
