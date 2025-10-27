import jwt from 'jsonwebtoken';
import connectToDatabase from '../mongodb.js';
import { connectAdminDb } from '../adminDb.js';

// Get admin user model (lazy loading)
async function getAdminUserModel() {
  const adminConnection = await connectAdminDb();
  
  const adminUserSchema = new (await import('mongoose')).Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin', enum: ['admin', 'super_admin'] },
    email: { type: String, required: false, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    permissions: [{ type: String, enum: ['upload_mcqs', 'manage_users', 'review_submissions', 'manage_categories'] }]
  }, { timestamps: true });

  // Hash password before saving
  adminUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.default.genSalt(10);
      this.password = await bcrypt.default.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Method to compare password
  adminUserSchema.methods.comparePassword = async function(password) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.compare(password, this.password);
  };

  // Public JSON method
  adminUserSchema.methods.toPublicJSON = function() {
    return {
      id: this._id,
      username: this.username,
      role: this.role,
      email: this.email,
      permissions: this.permissions,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt
    };
  };

  return adminConnection.models.AdminUser || 
         adminConnection.model('AdminUser', adminUserSchema);
}

// Login admin user - converted from your authController.login
export async function loginAdmin(formData) {
  try {
    const { username, password } = formData;

    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required',
        status: 400
      };
    }

    // Ensure admin database connection is established
    const adminConnection = await connectAdminDb();
    
    // Wait for connection to be ready
    if (adminConnection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        adminConnection.once('connected', resolve);
        adminConnection.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    }

    const AdminUser = await getAdminUserModel();

    // Find admin user
    const adminUser = await AdminUser.findOne({ username, isActive: true });

    if (!adminUser) {
      return {
        success: false,
        message: 'Invalid credentials',
        status: 401
      };
    }

    // Check password
    const isPasswordValid = await adminUser.comparePassword(password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials',
        status: 401
      };
    }

    // Update last login
    adminUser.lastLogin = new Date();
    await adminUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id, 
        username: adminUser.username,
        role: adminUser.role,
        permissions: adminUser.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: adminUser.toPublicJSON()
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}

// Get admin user profile - converted from your authController.getProfile
export async function getAdminProfile(userId) {
  try {
    const AdminUser = await getAdminUserModel();
    const adminUser = await AdminUser.findById(userId);
    
    if (!adminUser) {
      return {
        success: false,
        message: 'Admin user not found',
        status: 404
      };
    }

    return {
      success: true,
      data: adminUser.toPublicJSON()
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}

// Change admin password - converted from your authController.changePassword
export async function changeAdminPassword(userId, { currentPassword, newPassword }) {
  try {
    if (!currentPassword || !newPassword) {
      return {
        success: false,
        message: 'Current password and new password are required',
        status: 400
      };
    }

    const AdminUser = await getAdminUserModel();
    const adminUser = await AdminUser.findById(userId);

    if (!adminUser) {
      return {
        success: false,
        message: 'Admin user not found',
        status: 404
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await adminUser.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect',
        status: 400
      };
    }

    // Update password
    adminUser.password = newPassword;
    await adminUser.save();

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'Internal server error',
      status: 500
    };
  }
}
