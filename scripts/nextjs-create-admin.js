#!/usr/bin/env node

/**
 * Create Admin User Script for Next.js
 * Updated version of scripts/createAdmin.js for Next.js environment
 * 
 * Usage: node scripts/nextjs-create-admin.js
 */

import { connectAdminDb } from '../lib/adminDb.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function getAdminUserModel() {
  const adminConnection = await connectAdminDb();
  
  const mongoose = await import('mongoose');
  
  const adminUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin', enum: ['admin', 'super_admin'] },
    email: { type: String, required: false, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    permissions: [{ type: String, enum: ['upload_mcqs', 'manage_users', 'review_submissions', 'manage_categories'] }]
  }, { timestamps: true });

  // Hash password before saving
  adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Method to compare password
  adminUserSchema.methods.comparePassword = async function(password) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, this.password);
  };

  // Public JSON method
  adminUserSchema.methods.toPublicJSON = function() {
    return {
      id: this._id,
      username: this.username,
      role: this.role,
      email: this.email,
      permissions: this.permissions,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt
    };
  };

  return adminConnection.models.AdminUser || 
         adminConnection.model('AdminUser', adminUserSchema);
}

const createAdmin = async () => {
  try {
    console.log('🚀 Creating admin user for Next.js application...');
    
    // Verify environment variables
    if (!process.env.ADMIN_MONGO_URI && !process.env.MONGO_URI) {
      throw new Error('ADMIN_MONGO_URI or MONGO_URI not found in .env.local');
    }
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not found in .env.local - this is required for authentication');
    }
    
    // Connect to admin database
    await connectAdminDb();
    console.log('✅ Connected to admin database');
    
    const AdminUser = await getAdminUserModel();
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('📅 Created:', existingAdmin.createdAt);
      process.exit(0);
    }
    
    // Create new admin user
    const adminUser = new AdminUser({
      username: 'admin',
      password: 'Admin@123', // This will be hashed automatically
      role: 'admin',
      email: 'admin@mcqsbase.com',
      permissions: ['upload_mcqs', 'manage_users', 'review_submissions', 'manage_categories']
    });
    
    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   Email: admin@mcqsbase.com');
    console.log('');
    console.log('🔒 IMPORTANT: Change the password after first login!');
    console.log('');
    console.log('🌐 You can now login at:');
    console.log('   Development: http://localhost:3000/404/admin');
    console.log('   Production: https://yourdomain.com/404/admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Make sure .env.local exists with MONGO_URI or ADMIN_MONGO_URI');
    console.error('   2. Check database connection string');
    console.error('   3. Ensure MongoDB is running');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

createAdmin();
