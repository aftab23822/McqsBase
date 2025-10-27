import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';

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

// PATCH handler for updating contact status
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'read', 'replied', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Valid status is required (pending, read, replied, archived)' },
        { status: 400 }
      );
    }

    const Contact = await getContactModel();
    
    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Error updating contact status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a contact submission
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const Contact = await getContactModel();
    
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
