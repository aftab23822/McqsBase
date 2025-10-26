import mongoose from 'mongoose';
import { getAdminConnection } from '../config/adminDb.js';

const userSubmittedItemSchema = new mongoose.Schema({
  // Common fields
  type: { 
    type: String, 
    required: true, 
    enum: ['simple', 'pastpaper', 'interview'] 
  },
  question: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: function() { return this.type !== 'interview'; } 
  },
  username: { 
    type: String, 
    required: function() { return this.type !== 'interview'; } 
  },
  
  // MCQ fields (for simple and pastpaper types)
  options: {
    A: { type: String, required: function() { return this.type !== 'interview'; } },
    B: { type: String, required: function() { return this.type !== 'interview'; } },
    C: { type: String, required: function() { return this.type !== 'interview'; } },
    D: { type: String, required: function() { return this.type !== 'interview'; } },
    E: { type: String, required: false }
  },
  correctAnswer: { 
    type: String, 
    required: function() { return this.type !== 'interview'; },
    enum: ['A', 'B', 'C', 'D', 'E']
  },
  
  // Interview fields (for interview type)
  position: { 
    type: String, 
    required: function() { return this.type === 'interview'; } 
  },
  sharedBy: { 
    type: String, 
    required: function() { return this.type === 'interview'; } 
  },
  year: { 
    type: Number, 
    required: function() { return this.type === 'interview'; } 
  },
  department: { 
    type: String, 
    required: function() { return this.type === 'interview'; } 
  },
  experience: { 
    type: String, 
    required: false 
  },
  
  // Status fields
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'rejected'] 
  },
  reviewedBy: { 
    type: String 
  },
  reviewNotes: { 
    type: String 
  },
  reviewedAt: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Index for better query performance
userSubmittedItemSchema.index({ type: 1, status: 1 });
userSubmittedItemSchema.index({ category: 1 });
userSubmittedItemSchema.index({ createdAt: -1 });

// Lazy-load the model to avoid timing issues
let UserSubmittedItem = null;

const getUserSubmittedItemModel = () => {
  if (!UserSubmittedItem) {
    const adminConnection = getAdminConnection();
    UserSubmittedItem = adminConnection.model('UserSubmittedItem', userSubmittedItemSchema);
  }
  return UserSubmittedItem;
};

export default getUserSubmittedItemModel; 