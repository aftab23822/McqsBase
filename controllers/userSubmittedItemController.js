import getUserSubmittedItemModel from '../models/userSubmittedItem.js';

// Submit a new MCQ or interview question
export const submitItem = async (req, res) => {
  try {
    const {
      type,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      correctAnswer,
      category,
      username,
      position,
      sharedBy,
      year,
      department,
      experience
    } = req.body;

    // Validate required fields based on type
    if (!type || !question) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and question are required' 
      });
    }

    let submissionData = {
      type,
      question
    };

    if (type === 'interview') {
      // Validate interview fields
      if (!position || !sharedBy || !year || !department) {
        return res.status(400).json({ 
          success: false, 
          message: 'Position, shared by, year, and department are required for interview submissions' 
        });
      }
      
      submissionData = {
        ...submissionData,
        position,
        sharedBy,
        year: parseInt(year),
        department,
        experience: experience || ''
      };
    } else {
      // Validate MCQ fields
      if (!optionA || !optionB || !optionC || !optionD || !correctAnswer || !category || !username) {
        return res.status(400).json({ 
          success: false, 
          message: 'All MCQ fields are required' 
        });
      }

      submissionData = {
        ...submissionData,
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
          E: optionE || ''
        },
        correctAnswer,
        category,
        username
      };
    }

    const UserSubmittedItem = getUserSubmittedItemModel();
    const newSubmission = new UserSubmittedItem(submissionData);
    await newSubmission.save();

    res.status(201).json({
      success: true,
      message: 'Submission received successfully! Our team will review it shortly.',
      data: {
        id: newSubmission._id,
        type: newSubmission.type,
        status: newSubmission.status
      }
    });

  } catch (error) {
    console.error('Error submitting item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get all submissions (for admin panel)
export const getAllSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // pending, approved, rejected
    const type = req.query.type; // simple, pastpaper, interview
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const UserSubmittedItem = getUserSubmittedItemModel();
    const total = await UserSubmittedItem.countDocuments(filter);
    const submissions = await UserSubmittedItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      data: {
        results: submissions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get submission by ID
export const getSubmissionById = async (req, res) => {
  try {
    const UserSubmittedItem = getUserSubmittedItemModel();
    const submission = await UserSubmittedItem.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      data: submission
    });
    
  } catch (error) {
    console.error('Error getting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update submission content (for admin editing)
export const updateSubmissionContent = async (req, res) => {
  try {
    const {
      question,
      options,
      correctAnswer,
      answer,
      position,
      sharedBy,
      year,
      department,
      experience,
      category,
      username
    } = req.body;
    
    const updateData = {};
    
    // Update common fields
    if (question) updateData.question = question;
    if (options) updateData.options = options;
    if (correctAnswer) updateData.correctAnswer = correctAnswer;
    if (answer) updateData.answer = answer;
    if (position) updateData.position = position;
    if (sharedBy) updateData.sharedBy = sharedBy;
    if (year) updateData.year = parseInt(year);
    if (department) updateData.department = department;
    if (experience) updateData.experience = experience;
    if (category) updateData.category = category;
    if (username) updateData.username = username;
    
    const UserSubmittedItem = getUserSubmittedItemModel();
    const submission = await UserSubmittedItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission content updated successfully',
      data: submission
    });
    
  } catch (error) {
    console.error('Error updating submission content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update submission status (for admin)
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { status, reviewNotes, reviewedBy } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }
    
    const updateData = {
      status,
      reviewedAt: new Date()
    };
    
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;
    
    const UserSubmittedItem = getUserSubmittedItemModel();
    const submission = await UserSubmittedItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission status updated successfully',
      data: submission
    });
    
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get submission statistics (for admin dashboard)
export const getSubmissionStats = async (req, res) => {
  try {
    const UserSubmittedItem = getUserSubmittedItemModel();
    
    const stats = await UserSubmittedItem.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const typeStats = await UserSubmittedItem.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalSubmissions = await UserSubmittedItem.countDocuments();
    const pendingSubmissions = await UserSubmittedItem.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        statusBreakdown: stats,
        typeBreakdown: typeStats
      }
    });
    
  } catch (error) {
    console.error('Error getting submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 