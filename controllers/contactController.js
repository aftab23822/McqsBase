import Contact from '../models/contact.js';

/**
 * Submit a new contact form
 * @route POST /api/contact
 * @access Public
 */
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create new contact submission
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const contact = new Contact(contactData);
    await contact.save();

    // Log the contact submission for debugging
    console.log('Contact form submission saved:', {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      timestamp: contact.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all contact submissions (for admin use)
 * @route GET /api/contact
 * @access Private (Admin only)
 */
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Contact.countDocuments(query);

    res.status(200).json({
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
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single contact submission by ID
 * @route GET /api/contact/:id
 * @access Private (Admin only)
 */
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select('-__v');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update contact status
 * @route PATCH /api/contact/:id
 * @access Private (Admin only)
 */
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, read, replied, archived)'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a contact submission
 * @route DELETE /api/contact/:id
 * @access Private (Admin only)
 */
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 