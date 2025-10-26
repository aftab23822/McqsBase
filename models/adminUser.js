import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getAdminConnection } from '../config/adminDb.js';

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'super_admin']
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String,
    enum: ['upload_mcqs', 'manage_users', 'review_submissions', 'manage_categories']
  }]
}, {
  timestamps: true
});

// Hash password before saving
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
adminUserSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Lazy-load the model to avoid timing issues
let AdminUser = null;

const getAdminUserModel = () => {
  if (!AdminUser) {
    const adminConnection = getAdminConnection();
    AdminUser = adminConnection.model('AdminUser', adminUserSchema);
  }
  return AdminUser;
};

export default getAdminUserModel; 