import PastPaper from '../models/pastPaper.js';

// Get all Past Papers (paginated)
export const getPastPapers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await PastPaper.countDocuments();
  const pastPapers = await PastPaper.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: pastPapers,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new Past Paper
export const addPastPaper = async (req, res) => {
  const pastPaper = new PastPaper(req.body);
  await pastPaper.save();
  res.status(201).json(pastPaper);
};

// Update a Past Paper
export const updatePastPaper = async (req, res) => {
  const pastPaper = await PastPaper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(pastPaper);
};

// Delete a Past Paper
export const deletePastPaper = async (req, res) => {
  await PastPaper.findByIdAndDelete(req.params.id);
  res.json({ message: 'Past Paper deleted' });
};

export const getPastPapersBySubject = async (req, res) => {
  const { subject } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { title: { $regex: new RegExp(subject, 'i') } };
  const total = await PastPaper.countDocuments(filter);
  const pastPapers = await PastPaper.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: pastPapers,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}; 