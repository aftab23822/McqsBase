import mongoose from 'mongoose';

const pastInterviewSchema = new mongoose.Schema({
  // Canonical fields for Past Interviews
  interviewTitle: { type: String, required: true },
  description: { type: String, required: true },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  position: { type: String },
  department: { type: String },
  sharedBy: { type: String },
  experience: { type: String },
  year: { type: Number }
}, { timestamps: true });

export default mongoose.models.PastInterview || mongoose.model('PastInterview', pastInterviewSchema);
