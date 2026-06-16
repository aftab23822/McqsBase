import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [220, 'Title cannot exceed 220 characters']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  category: {
    type: String,
    trim: true,
    default: 'Exam Guide',
    maxlength: [80, 'Category cannot exceed 80 characters']
  },
  body: {
    type: String,
    required: [true, 'Blog content is required'],
    trim: true,
    maxlength: [100000, 'Blog content cannot exceed 100000 characters']
  },
  seoTitle: {
    type: String,
    required: [true, 'SEO title is required'],
    trim: true,
    maxlength: [220, 'SEO title cannot exceed 220 characters']
  },
  primaryKeyword: {
    type: String,
    required: [true, 'Primary keyword is required'],
    trim: true,
    maxlength: [160, 'Primary keyword cannot exceed 160 characters']
  },
  seoUri: {
    type: String,
    required: [true, 'SEO URI is required'],
    trim: true,
    lowercase: true,
    maxlength: [180, 'SEO URI cannot exceed 180 characters'],
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'SEO URI must be a slug like nts-preparation-guide']
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required'],
    trim: true,
    maxlength: [320, 'Meta description cannot exceed 320 characters']
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  author: {
    type: String,
    trim: true,
    default: 'McqsBase Team',
    maxlength: [100, 'Author cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  }
}, {
  timestamps: true
});

blogSchema.index({ seoUri: 1 }, { unique: true });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ primaryKeyword: 1 });

blogSchema.pre('save', function setPublishedAt(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.status === 'draft') {
    this.publishedAt = null;
  }
  next();
});

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);
