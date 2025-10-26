import jwt from 'jsonwebtoken';
import getAdminUserModel from '../models/adminUser.js';

// Login admin user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const AdminUser = getAdminUserModel();

    // Find admin user
    const adminUser = await AdminUser.findOne({ username, isActive: true });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await adminUser.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
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

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: adminUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get admin user profile
export const getProfile = async (req, res) => {
  try {
    const AdminUser = getAdminUserModel();
    const adminUser = await AdminUser.findById(req.user.userId);
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      data: adminUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change admin password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const AdminUser = getAdminUserModel();
    const adminUser = await AdminUser.findById(req.user.userId);

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await adminUser.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    adminUser.password = newPassword;
    await adminUser.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 