const express = require('express');
const { auth } = require('../middleware/auth');
const Goal = require('../models/Goal');

const router = express.Router();

// @route   POST /api/goals
// @desc    Create a new savings goal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      targetAmount,
      category,
      priority,
      targetDate,
      autoSave,
      tags
    } = req.body;

    // Validation
    if (!title || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, target amount, and target date are required.'
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than 0.'
      });
    }

    const goalTargetDate = new Date(targetDate);
    if (goalTargetDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Target date must be in the future.'
      });
    }

    // Create goal object
    const goalData = {
      user: req.user._id,
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      category: category || 'other',
      priority: priority || 'medium',
      targetDate: goalTargetDate
    };

    // Add optional fields
    if (description) goalData.description = description.trim();
    if (autoSave) goalData.autoSave = autoSave;
    if (tags && Array.isArray(tags)) goalData.tags = tags.map(tag => tag.trim());

    // Create default milestones (25%, 50%, 75%, 100%)
    goalData.milestones = [
      { percentage: 25, amount: targetAmount * 0.25 },
      { percentage: 50, amount: targetAmount * 0.5 },
      { percentage: 75, amount: targetAmount * 0.75 },
      { percentage: 100, amount: targetAmount }
    ];

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Goal created successfully!',
      goal
    });

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating goal.'
    });
  }
});

// @route   GET /api/goals
// @desc    Get user's goals with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      status = 'active',
      category,
      priority,
      sortBy = 'targetDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const goals = await Goal.find(filter).sort(sort);

    // Add computed fields
    const goalsWithProgress = goals.map(goal => ({
      ...goal.toObject(),
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      requiredDailySavings: goal.requiredDailySavings
    }));

    res.json({
      success: true,
      goals: goalsWithProgress
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals.'
    });
  }
});

// @route   GET /api/goals/:id
// @desc    Get a specific goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    // Add computed fields
    const goalWithProgress = {
      ...goal.toObject(),
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      requiredDailySavings: goal.requiredDailySavings
    };

    res.json({
      success: true,
      goal: goalWithProgress
    });

  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goal.'
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      targetAmount,
      category,
      priority,
      targetDate,
      status,
      autoSave,
      tags
    } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    // Update fields if provided
    if (title) goal.title = title.trim();
    if (description) goal.description = description.trim();
    if (category) goal.category = category;
    if (priority) goal.priority = priority;
    if (status) goal.status = status;
    if (autoSave) goal.autoSave = { ...goal.autoSave, ...autoSave };
    if (tags && Array.isArray(tags)) goal.tags = tags.map(tag => tag.trim());

    if (targetAmount !== undefined) {
      if (targetAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Target amount must be greater than 0.'
        });
      }
      goal.targetAmount = parseFloat(targetAmount);
      
      // Update milestones based on new target amount
      goal.milestones = [
        { percentage: 25, amount: targetAmount * 0.25 },
        { percentage: 50, amount: targetAmount * 0.5 },
        { percentage: 75, amount: targetAmount * 0.75 },
        { percentage: 100, amount: targetAmount }
      ];
    }

    if (targetDate) {
      const goalTargetDate = new Date(targetDate);
      if (goalTargetDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Target date must be in the future.'
        });
      }
      goal.targetDate = goalTargetDate;
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Goal updated successfully!',
      goal
    });

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating goal.'
    });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully!'
    });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting goal.'
    });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to a goal
// @access  Private
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, note, source } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid contribution amount is required.'
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot contribute to inactive goal.'
      });
    }

    await goal.addContribution(parseFloat(amount), note || '', source || 'manual');

    // Add computed fields for response
    const goalWithProgress = {
      ...goal.toObject(),
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      requiredDailySavings: goal.requiredDailySavings
    };

    res.json({
      success: true,
      message: 'Contribution added successfully!',
      goal: goalWithProgress
    });

  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding contribution.'
    });
  }
});

// @route   GET /api/goals/analytics/summary
// @desc    Get goals summary and statistics
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const stats = await Goal.getUserGoalStats(req.user._id);
    const overdueGoals = await Goal.getOverdueGoals(req.user._id);
    const priorityGoals = await Goal.getGoalsByPriority(req.user._id);

    // Calculate total savings across all goals
    const totalSaved = Object.values(stats).reduce((sum, stat) => sum + stat.totalCurrent, 0);
    const totalTarget = Object.values(stats).reduce((sum, stat) => sum + stat.totalTarget, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    res.json({
      success: true,
      summary: {
        stats,
        totalSaved,
        totalTarget,
        overallProgress: Math.round(overallProgress * 100) / 100,
        overdueCount: overdueGoals.length,
        activeCount: stats.active.count,
        completedCount: stats.completed.count,
        highPriorityCount: priorityGoals.filter(g => g.priority === 'high' || g.priority === 'urgent').length
      }
    });

  } catch (error) {
    console.error('Goals summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals summary.'
    });
  }
});

// @route   GET /api/goals/overdue
// @desc    Get overdue goals
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const overdueGoals = await Goal.getOverdueGoals(req.user._id);

    const goalsWithProgress = overdueGoals.map(goal => ({
      ...goal.toObject(),
      progressPercentage: goal.progressPercentage,
      daysRemaining: goal.daysRemaining,
      requiredDailySavings: goal.requiredDailySavings
    }));

    res.json({
      success: true,
      overdueGoals: goalsWithProgress
    });

  } catch (error) {
    console.error('Get overdue goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue goals.'
    });
  }
});

// @route   POST /api/goals/:id/auto-save
// @desc    Process auto-save for a goal
// @access  Private
router.post('/:id/auto-save', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    if (!goal.autoSave.enabled || goal.autoSave.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Auto-save is not enabled for this goal.'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot auto-save to inactive goal.'
      });
    }

    // Check if auto-save is due
    const now = new Date();
    const lastAutoSave = goal.autoSave.lastAutoSave;
    let isDue = false;

    if (!lastAutoSave) {
      isDue = true;
    } else {
      const daysSinceLastSave = (now - lastAutoSave) / (1000 * 60 * 60 * 24);
      
      switch (goal.autoSave.frequency) {
        case 'daily':
          isDue = daysSinceLastSave >= 1;
          break;
        case 'weekly':
          isDue = daysSinceLastSave >= 7;
          break;
        case 'monthly':
          isDue = daysSinceLastSave >= 30;
          break;
      }
    }

    if (!isDue) {
      return res.status(400).json({
        success: false,
        message: 'Auto-save is not due yet.'
      });
    }

    // Process auto-save
    await goal.addContribution(goal.autoSave.amount, 'Auto-save contribution', 'auto-save');
    goal.autoSave.lastAutoSave = now;
    await goal.save();

    res.json({
      success: true,
      message: `Auto-saved ₹${goal.autoSave.amount} to ${goal.title}!`,
      goal
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing auto-save.'
    });
  }
});

module.exports = router;

