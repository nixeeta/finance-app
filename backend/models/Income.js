const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    required: true,
    enum: [
      'allowance',
      'stipend',
      'scholarship',
      'part-time-job',
      'freelance',
      'internship',
      'family',
      'gift',
      'investment',
      'side-hustle',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: null
  },
  nextExpectedDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'upi', 'cheque', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
incomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate next expected date for recurring income
  if (this.isRecurring && this.recurringFrequency && !this.nextExpectedDate) {
    const nextDate = new Date(this.date);
    
    switch (this.recurringFrequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    this.nextExpectedDate = nextDate;
  }
  
  next();
});

// Index for better query performance
incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, source: 1 });
incomeSchema.index({ user: 1, isRecurring: 1, nextExpectedDate: 1 });

// Static method to get source-wise income for a user
incomeSchema.statics.getSourceWiseIncome = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$source',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

// Static method to get monthly income trend
incomeSchema.statics.getMonthlyIncomeTrend = async function(userId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Static method to get upcoming recurring income
incomeSchema.statics.getUpcomingRecurringIncome = async function(userId, days = 30) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return await this.find({
    user: userId,
    isRecurring: true,
    nextExpectedDate: { $lte: endDate }
  }).sort({ nextExpectedDate: 1 });
};

// Instance method to calculate total income for current month
incomeSchema.statics.getCurrentMonthTotal = async function(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('Income', incomeSchema);

