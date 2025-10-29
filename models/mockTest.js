import mongoose from 'mongoose';

const mockTestQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  universitySlug: { type: String, required: true, index: true },
  category: { type: String, default: 'universities' },
  durationMinutes: { type: Number, default: 30 },
  questions: [mockTestQuestionSchema],
  lastUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

mockTestSchema.index({ universitySlug: 1, slug: 1 }, { unique: true });

const MockTest = mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema);

export default MockTest;


