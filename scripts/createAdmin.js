import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectAdminDb } from '../config/adminDb.js';
import getAdminUserModel from '../models/adminUser.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to admin database
    await connectAdminDb();
    
    const AdminUser = getAdminUserModel();
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create new admin user
    const adminUser = new AdminUser({
      username: 'admin',
      password: 'admin123', // This will be hashed automatically - try this password
      role: 'admin',
      email: 'admin@example.com',
      permissions: ['upload_mcqs', 'manage_users', 'review_submissions', 'manage_categories']
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log('Please change the password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 