const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  college: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },
    spendingAlerts: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  aiInsights: {
    lastSummaryDate: {
      type: Date,
      default: null
    },
    totalSummariesGenerated: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's total expenses for current month
userSchema.methods.getCurrentMonthExpenses = async function() {
  const Expense = require('./Expense');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  const expenses = await Expense.find({
    user: this._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });
  
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// Get user's budget utilization percentage
userSchema.methods.getBudgetUtilization = async function() {
  const currentExpenses = await this.getCurrentMonthExpenses();
  if (this.monthlyBudget === 0) return 0;
  return (currentExpenses / this.monthlyBudget) * 100;
};

module.exports = mongoose.model('User', userSchema);

