import mongoose from 'mongoose';

if (!process.env.ADMIN_MONGO_URI && !process.env.MONGO_URI) {
  throw new Error('Please define the ADMIN_MONGO_URI or MONGO_URI environment variable inside .env.local');
}

// Admin database URI - use 'admindb' instead of 'admin' to avoid conflicts
const ADMIN_MONGO_URI = process.env.ADMIN_MONGO_URI || 
  (process.env.MONGO_URI?.replace('/mcqs', '/admindb')) || 
  'mongodb://localhost:27017/admindb';

let adminConnection = null;

export const connectAdminDb = async () => {
  try {
    if (!adminConnection) {
      adminConnection = await mongoose.createConnection(ADMIN_MONGO_URI, {
        bufferCommands: false,
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
