const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'food',
      'transport',
      'entertainment',
      'shopping',
      'education',
      'health',
      'rent',
      'utilities',
      'subscriptions',
      'party',
      'emergency',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
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
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, createdAt: -1 });

// Static method to get category-wise expenses for a user
expenseSchema.statics.getCategoryWiseExpenses = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
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

// Static method to get monthly spending trend
expenseSchema.statics.getMonthlyTrend = async function(userId, months = 6) {
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

// Instance method to suggest category based on description
expenseSchema.methods.suggestCategory = function() {
  const description = this.description.toLowerCase();
  
  const categoryKeywords = {
    food: ['food', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast', 'snack', 'pizza', 'burger', 'maggi', 'canteen'],
    transport: ['uber', 'ola', 'bus', 'metro', 'train', 'auto', 'taxi', 'fuel', 'petrol', 'diesel'],
    entertainment: ['movie', 'cinema', 'game', 'concert', 'show', 'netflix', 'spotify', 'youtube'],
    shopping: ['amazon', 'flipkart', 'clothes', 'shoes', 'shopping', 'mall', 'store'],
    education: ['book', 'course', 'fee', 'tuition', 'exam', 'certification', 'udemy', 'coursera'],
    health: ['medicine', 'doctor', 'hospital', 'pharmacy', 'medical', 'health'],
    rent: ['rent', 'hostel', 'accommodation', 'pg'],
    utilities: ['electricity', 'water', 'internet', 'wifi', 'mobile', 'recharge'],
    subscriptions: ['subscription', 'premium', 'pro', 'plus', 'monthly'],
    party: ['party', 'club', 'bar', 'alcohol', 'beer', 'celebration']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
};

module.exports = mongoose.model('Expense', expenseSchema);

