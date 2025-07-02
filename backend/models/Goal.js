const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'emergency-fund',
      'gadget',
      'travel',
      'education',
      'investment',
      'entertainment',
      'health',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  autoSave: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly'
    },
    lastAutoSave: {
      type: Date,
      default: null
    }
  },
  milestones: [{
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      min: 0
    },
    achievedDate: {
      type: Date,
      default: null
    },
    isAchieved: {
      type: Boolean,
      default: false
    }
  }],
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: ['manual', 'auto-save', 'bonus', 'other'],
      default: 'manual'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
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
goalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update status based on current amount
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Check and update milestones
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.amount) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });
  
  next();
});

// Index for better query performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ user: 1, priority: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.targetDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for required daily savings
goalSchema.virtual('requiredDailySavings').get(function() {
  const remaining = this.targetAmount - this.currentAmount;
  const daysLeft = this.daysRemaining;
  
  if (daysLeft <= 0 || remaining <= 0) return 0;
  return remaining / daysLeft;
});

// Instance method to add contribution
goalSchema.methods.addContribution = function(amount, note = '', source = 'manual') {
  this.contributions.push({
    amount,
    note,
    source,
    date: new Date()
  });
  
  this.currentAmount += amount;
  return this.save();
};

// Static method to get user's goal statistics
goalSchema.statics.getUserGoalStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTarget: { $sum: '$targetAmount' },
        totalCurrent: { $sum: '$currentAmount' }
      }
    }
  ]);
  
  const result = {
    active: { count: 0, totalTarget: 0, totalCurrent: 0 },
    completed: { count: 0, totalTarget: 0, totalCurrent: 0 },
    paused: { count: 0, totalTarget: 0, totalCurrent: 0 },
    cancelled: { count: 0, totalTarget: 0, totalCurrent: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      totalTarget: stat.totalTarget,
      totalCurrent: stat.totalCurrent
    };
  });
  
  return result;
};

// Static method to get goals by priority
goalSchema.statics.getGoalsByPriority = async function(userId) {
  return await this.find({ 
    user: userId, 
    status: 'active' 
  }).sort({ 
    priority: 1, 
    targetDate: 1 
  });
};

// Static method to get overdue goals
goalSchema.statics.getOverdueGoals = async function(userId) {
  const today = new Date();
  return await this.find({
    user: userId,
    status: 'active',
    targetDate: { $lt: today }
  });
};

module.exports = mongoose.model('Goal', goalSchema);

