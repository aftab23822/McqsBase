import mongoose from 'mongoose';

const pastInterviewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number },
  department: { type: String },
  questions: [{
    question: { type: String, required: true },
    answer: { type: String }
  }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }
}, { timestamps: true });

const PastInterview = mongoose.model('PastInterview', pastInterviewSchema);

export default PastInterview; 