import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';

// Get Contact model (lazy loading)
async function getContactModel() {
  const mongoose = await import('mongoose');
  const connection = await connectToDatabase();
  
  const contactSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'read', 'replied', 'archived'],
      default: 'pending'
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  }, {
    timestamps: true
  });

  // Indexes
  contactSchema.index({ email: 1, createdAt: -1 });
  contactSchema.index({ status: 1, createdAt: -1 });

  return connection.models.Contact || connection.model('Contact', contactSchema);
}

// GET handler for admin to fetch contact submissions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const Contact = await getContactModel();
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Contact.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for submitting contact form
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const headers = request.headers;
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    const Contact = await getContactModel();

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress,
      userAgent
    });

    await contact.save();

    console.log('Contact form submission saved:', {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      timestamp: contact.createdAt
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully',
        data: {
          id: contact._id,
          submittedAt: contact.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
