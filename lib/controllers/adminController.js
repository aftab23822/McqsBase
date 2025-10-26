import connectToDatabase from '../mongodb.js';
import MCQ from '../models/MCQ.js';
import PastPaper from '../models/PastPaper.js';
import PastInterview from '../models/PastInterview.js';
import Quiz from '../models/Quiz.js';

// Get upload statistics - converted from your adminController.getUploadStats
export async function getUploadStats() {
  try {
    await connectToDatabase();

    const mcqCount = await MCQ.countDocuments();
    const pastPaperCount = await PastPaper.countDocuments();
    const pastInterviewCount = await PastInterview.countDocuments();
    const quizCount = await Quiz.countDocuments();

    return {
      success: true,
      data: {
        mcqs: mcqCount,
        pastPapers: pastPaperCount,
        pastInterviews: pastInterviewCount,
        quizzes: quizCount,
        total: mcqCount + pastPaperCount + pastInterviewCount + quizCount
      }
    };
  } catch (error) {
    console.error('Stats error:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}
