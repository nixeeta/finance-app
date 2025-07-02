const express = require('express');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'brokeaf_secret_key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college, course, monthlyBudget } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college?.trim(),
      course: course?.trim(),
      monthlyBudget: monthlyBudget || 0
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      course: user.course,
      monthlyBudget: user.monthlyBudget,
      currency: user.currency,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      course: user.course,
      monthlyBudget: user.monthlyBudget,
      currency: user.currency,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get additional stats
    const currentMonthExpenses = await user.getCurrentMonthExpenses();
    const budgetUtilization = await user.getBudgetUtilization();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      course: user.course,
      monthlyBudget: user.monthlyBudget,
      currency: user.currency,
      preferences: user.preferences,
      aiInsights: user.aiInsights,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      stats: {
        currentMonthExpenses,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100
      }
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile.'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, college, course, monthlyBudget, currency, preferences } = req.body;
    const user = req.user;

    // Update fields if provided
    if (name) user.name = name.trim();
    if (college) user.college = college.trim();
    if (course) user.course = course.trim();
    if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
    if (currency) user.currency = currency;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      course: user.course,
      monthlyBudget: user.monthlyBudget,
      currency: user.currency,
      preferences: user.preferences,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile.'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password.'
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    // Verify password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect.'
      });
    }

    // Delete user and all related data
    const Expense = require('../models/Expense');
    const Income = require('../models/Income');
    const Goal = require('../models/Goal');

    await Promise.all([
      Expense.deleteMany({ user: user._id }),
      Income.deleteMany({ user: user._id }),
      Goal.deleteMany({ user: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({
      success: true,
      message: 'Account deleted successfully.'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account.'
    });
  }
});

module.exports = router;

