import MCQ from '../models/mcq.js';
import PastPaper from '../models/pastPaper.js';
import PastInterview from '../models/pastInterview.js';
import Quiz from '../models/quiz.js';

export const getUploadStats = async (req, res) => {
  try {
    const mcqCount = await MCQ.countDocuments();
    const pastPaperCount = await PastPaper.countDocuments();
    const pastInterviewCount = await PastInterview.countDocuments();
    const quizCount = await Quiz.countDocuments();

    res.json({
      mcqs: mcqCount,
      pastPapers: pastPaperCount,
      pastInterviews: pastInterviewCount,
      quizzes: quizCount,
      total: mcqCount + pastPaperCount + pastInterviewCount + quizCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 