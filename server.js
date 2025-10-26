import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';
import { connectAdminDb } from './config/adminDb.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to main database
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Main MongoDB connected');
    
    // Connect to admin database
    try {
      await connectAdminDb();
      console.log('Admin database connected');
    } catch (error) {
      console.error('Failed to connect to admin database:', error);
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 