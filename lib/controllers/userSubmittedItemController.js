import { connectAdminDb } from '../adminDb.js';

// Get user submitted item model (lazy loading)
async function getUserSubmittedItemModel() {
  const adminConnection = await connectAdminDb();
  
  const mongoose = await import('mongoose');
  
  const userSubmittedItemSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ['simple', 'pastpaper', 'interview']
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      A: String,
      B: String,
      C: String,
      D: String,
      E: String
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E']
    },
    answer: String,
    category: String,
    username: String,
    position: String,
    sharedBy: String,
    year: Number,
    department: String,
    experience: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewNotes: String,
    reviewedBy: String,
    reviewedAt: Date
  }, { timestamps: true });

  userSubmittedItemSchema.index({ createdAt: -1 });

  // Wait for connection to be ready before returning model
  if (adminConnection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      adminConnection.once('connected', resolve);
      adminConnection.once('error', reject);
      setTimeout(() => reject(new Error('Model connection timeout')), 5000);
    });
  }

  return adminConnection.models.UserSubmittedItem || 
         adminConnection.model('UserSubmittedItem', userSubmittedItemSchema);
}

// Submit a new MCQ or interview question - converted from your controller
export async function submitItem(formData) {
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
    } = formData;

    // Validate required fields based on type
    if (!type || !question) {
      return { 
        success: false, 
        message: 'Type and question are required',
        status: 400
      };
    }

    let submissionData = {
      type,
      question
    };

    if (type === 'interview') {
      // Validate interview fields
      if (!position || !sharedBy || !year || !department) {
        return { 
          success: false, 
          message: 'Position, shared by, year, and department are required for interview submissions',
          status: 400
        };
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
        return { 
          success: false, 
          message: 'All MCQ fields are required',
          status: 400
        };
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

    const UserSubmittedItem = await getUserSubmittedItemModel();
    const newSubmission = new UserSubmittedItem(submissionData);
    await newSubmission.save();

    return {
      success: true,
      message: 'Submission received successfully! Our team will review it shortly.',
      data: {
        id: newSubmission._id,
        type: newSubmission.type,
        status: newSubmission.status
      }
    };

  } catch (error) {
    console.error('Error submitting item:', error);
    return {
      success: false,
      message: 'Internal server error. Please try again later.',
      status: 500
    };
  }
}

// Get all submissions (for admin panel) - converted from your controller
export async function getAllSubmissions(query) {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const status = query.status; // pending, approved, rejected
    const type = query.type; // simple, pastpaper, interview
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const UserSubmittedItem = await getUserSubmittedItemModel();
    const total = await UserSubmittedItem.countDocuments(filter);
    const submissions = await UserSubmittedItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      success: true,
      data: {
        results: submissions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('Error getting submissions:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}

// Get submission by ID - converted from your controller
export async function getSubmissionById(id) {
  try {
    const UserSubmittedItem = await getUserSubmittedItemModel();
    const submission = await UserSubmittedItem.findById(id);
    
    if (!submission) {
      return {
        success: false,
        message: 'Submission not found',
        status: 404
      };
    }
    
    return {
      success: true,
      data: submission
    };
    
  } catch (error) {
    console.error('Error getting submission:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}

// Update submission status (for admin) - converted from your controller
export async function updateSubmissionStatus(id, { status, reviewNotes, reviewedBy }) {
  try {
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return {
        success: false,
        message: 'Valid status is required',
        status: 400
      };
    }
    
    const updateData = {
      status,
      reviewedAt: new Date()
    };
    
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;
    
    const UserSubmittedItem = await getUserSubmittedItemModel();
    const submission = await UserSubmittedItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!submission) {
      return {
        success: false,
        message: 'Submission not found',
        status: 404
      };
    }
    
    return {
      success: true,
      message: 'Submission status updated successfully',
      data: submission
    };
    
  } catch (error) {
    console.error('Error updating submission status:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}

// Get submission statistics (for admin dashboard) - converted from your controller
export async function getSubmissionStats() {
  try {
    const UserSubmittedItem = await getUserSubmittedItemModel();
    
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
    
    return {
      success: true,
      data: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        statusBreakdown: stats,
        typeBreakdown: typeStats
      }
    };
    
  } catch (error) {
    console.error('Error getting submission stats:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}
