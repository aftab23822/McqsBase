import mongoose from 'mongoose';

const pastPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number },
  department: { type: String },
  pdfUrl: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }
}, { timestamps: true });

const PastPaper = mongoose.model('PastPaper', pastPaperSchema);

export default PastPaper; 