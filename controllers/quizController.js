import Quiz from '../models/quiz.js';

// Get all Quizzes (paginated)
export const getQuizzes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await Quiz.countDocuments();
  const quizzes = await Quiz.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: quizzes,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new Quiz
export const addQuiz = async (req, res) => {
  const quiz = new Quiz(req.body);
  await quiz.save();
  res.status(201).json(quiz);
};

// Update a Quiz
export const updateQuiz = async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(quiz);
};

// Delete a Quiz
export const deleteQuiz = async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Quiz deleted' });
};

export const getQuizBySubject = async (req, res) => {
  const { subject } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { title: { $regex: new RegExp(subject, 'i') } };
  const total = await Quiz.countDocuments(filter);
  const quizzes = await Quiz.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: quizzes,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}; 