import dotenv from 'dotenv';
import { connectAdminDb } from '../config/adminDb.js';
import getAdminUserModel from '../models/adminUser.js';
import getUserSubmittedItemModel from '../models/userSubmittedItem.js';

dotenv.config();

const testAdminDb = async () => {
  try {
    console.log('Testing admin database connection...');
    
    // Connect to admin database
    await connectAdminDb();
    console.log('✅ Admin database connected successfully');
    
    // Test AdminUser model
    const AdminUser = getAdminUserModel();
    const adminCount = await AdminUser.countDocuments();
    console.log(`✅ AdminUser model working - ${adminCount} admin users found`);
    
    // Test UserSubmittedItem model
    const UserSubmittedItem = getUserSubmittedItemModel();
    const submissionCount = await UserSubmittedItem.countDocuments();
    console.log(`✅ UserSubmittedItem model working - ${submissionCount} submissions found`);
    
    console.log('🎉 All admin database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin database test failed:', error);
    process.exit(1);
  }
};

testAdminDb(); 