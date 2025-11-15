import mongoose from 'mongoose';

const pastPaperSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
  explanation: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  link: { type: String },
  submittedBy: { type: String },
  pageOrder: { type: Number, default: 0 },  // Track order within page
  slug: { type: String, index: true, sparse: true },  // Canonical slug (unique per category)
  year: { type: Number },  // Year for past papers
  department: { type: String },  // Department for past papers
  commission: { type: String },  // Commission (e.g., FPSC, SPSC)
  role: { type: String }  // Role/position
}, { timestamps: true });

// Support sitemap pagination queries sorted by updatedAt/_id
pastPaperSchema.index({ updatedAt: -1, _id: -1 });

// Compound index for slug + categoryId uniqueness
pastPaperSchema.index({ slug: 1, categoryId: 1 }, { unique: true, sparse: true });

// Index for category queries
pastPaperSchema.index({ categoryId: 1 });

export default mongoose.models.PastPaper || mongoose.model('PastPaper', pastPaperSchema);
