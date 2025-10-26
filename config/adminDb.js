import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Admin database URI - use 'admindb' instead of 'admin' to avoid conflicts
const ADMIN_MONGO_URI = process.env.ADMIN_MONGO_URI || process.env.MONGO_URI?.replace('/mcqs', '/admindb') || 'mongodb://localhost:27017/admindb';

let adminConnection = null;

export const connectAdminDb = async () => {
  try {
    if (!adminConnection) {
      adminConnection = await mongoose.createConnection(ADMIN_MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
    }
    return adminConnection;
  } catch (error) {
    console.error('Admin database connection error:', error);
    throw error;
  }
};

export const getAdminConnection = () => {
  if (!adminConnection) {
    throw new Error('Admin database not connected. Call connectAdminDb() first.');
  }
  return adminConnection;
};

export const disconnectAdminDb = async () => {
  if (adminConnection) {
    await adminConnection.close();
    adminConnection = null;
    console.log('Admin database disconnected');
  }
}; 