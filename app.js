import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import mcqRoutes from './routes/mcqRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import pastPaperRoutes from './routes/pastPaperRoutes.js';
import pastInterviewRoutes from './routes/pastInterviewRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import subcategoryRoutes from './routes/subcategoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userSubmittedItemRoutes from './routes/userSubmittedItemRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

//app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

app.get('/', (req, res) => {
  res.send('MCQs API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/pastpapers', pastPaperRoutes);
app.use('/api/interviews', pastInterviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/user-submissions', userSubmittedItemRoutes);
app.use('/api/contact', contactRoutes);

export default app; 