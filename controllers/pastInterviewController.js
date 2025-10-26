import PastInterview from '../models/pastInterview.js';

// Get all Past Interviews (paginated)
export const getPastInterviews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await PastInterview.countDocuments();
  const pastInterviews = await PastInterview.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: pastInterviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

// Add a new Past Interview
export const addPastInterview = async (req, res) => {
  const pastInterview = new PastInterview(req.body);
  await pastInterview.save();
  res.status(201).json(pastInterview);
};

// Update a Past Interview
export const updatePastInterview = async (req, res) => {
  const pastInterview = await PastInterview.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(pastInterview);
};

// Delete a Past Interview
export const deletePastInterview = async (req, res) => {
  await PastInterview.findByIdAndDelete(req.params.id);
  res.json({ message: 'Past Interview deleted' });
};

export const getPastInterviewsBySubject = async (req, res) => {
  const { subject } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { title: { $regex: new RegExp(subject, 'i') } };
  const total = await PastInterview.countDocuments(filter);
  const pastInterviews = await PastInterview.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  res.json({
    results: pastInterviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}; 