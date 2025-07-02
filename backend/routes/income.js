const express = require('express');
const { auth } = require('../middleware/auth');
const Income = require('../models/Income');

const router = express.Router();

// @route   POST /api/income
// @desc    Add a new income entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      amount,
      source,
      description,
      date,
      isRecurring,
      recurringFrequency,
      paymentMethod,
      notes,
      tags
    } = req.body;

    // Validation
    if (!amount || !source || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount, source, and description are required.'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.'
      });
    }

    // Create income object
    const incomeData = {
      user: req.user._id,
      amount: parseFloat(amount),
      source,
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'other'
    };

    // Add optional fields
    if (isRecurring) incomeData.isRecurring = isRecurring;
    if (recurringFrequency) incomeData.recurringFrequency = recurringFrequency;
    if (notes) incomeData.notes = notes.trim();
    if (tags && Array.isArray(tags)) incomeData.tags = tags.map(tag => tag.trim());

    const income = new Income(incomeData);
    await income.save();

    res.status(201).json({
      success: true,
      message: 'Income added successfully!',
      income
    });

  } catch (error) {
    console.error('Add income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding income.'
    });
  }
});

// @route   GET /api/income
// @desc    Get user's income with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (source && source !== 'all') {
      filter.source = source;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [incomes, total] = await Promise.all([
      Income.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Income.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      incomes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalIncomes: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching income.'
    });
  }
});

// @route   GET /api/income/:id
// @desc    Get a specific income entry
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    res.json({
      success: true,
      income
    });

  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching income.'
    });
  }
});

// @route   PUT /api/income/:id
// @desc    Update an income entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      amount,
      source,
      description,
      date,
      isRecurring,
      recurringFrequency,
      paymentMethod,
      notes,
      tags
    } = req.body;

    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    // Update fields if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0.'
        });
      }
      income.amount = parseFloat(amount);
    }

    if (source) income.source = source;
    if (description) income.description = description.trim();
    if (date) income.date = new Date(date);
    if (isRecurring !== undefined) income.isRecurring = isRecurring;
    if (recurringFrequency) income.recurringFrequency = recurringFrequency;
    if (paymentMethod) income.paymentMethod = paymentMethod;
    if (notes) income.notes = notes.trim();
    if (tags && Array.isArray(tags)) income.tags = tags.map(tag => tag.trim());

    await income.save();

    res.json({
      success: true,
      message: 'Income updated successfully!',
      income
    });

  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating income.'
    });
  }
});

// @route   DELETE /api/income/:id
// @desc    Delete an income entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully!'
    });

  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting income.'
    });
  }
});

// @route   GET /api/income/analytics/source-wise
// @desc    Get source-wise income analytics
// @access  Private
router.get('/analytics/source-wise', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date();
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    const sourceData = await Income.getSourceWiseIncome(req.user._id, start, end);

    res.json({
      success: true,
      data: sourceData,
      period: { start, end }
    });

  } catch (error) {
    console.error('Source analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching source analytics.'
    });
  }
});

// @route   GET /api/income/analytics/monthly-trend
// @desc    Get monthly income trend
// @access  Private
router.get('/analytics/monthly-trend', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const trendData = await Income.getMonthlyIncomeTrend(req.user._id, parseInt(months));

    res.json({
      success: true,
      data: trendData
    });

  } catch (error) {
    console.error('Monthly income trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly income trend.'
    });
  }
});

// @route   GET /api/income/analytics/summary
// @desc    Get income summary for current month
// @access  Private
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const currentMonthTotal = await Income.getCurrentMonthTotal(req.user._id);
    const upcomingRecurring = await Income.getUpcomingRecurringIncome(req.user._id, 30);

    // Get previous month total for comparison
    const prevMonthStart = new Date();
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    prevMonthStart.setDate(1);
    prevMonthStart.setHours(0, 0, 0, 0);
    
    const prevMonthEnd = new Date();
    prevMonthEnd.setDate(0);
    prevMonthEnd.setHours(23, 59, 59, 999);

    const prevMonthTotal = await Income.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: prevMonthStart, $lte: prevMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const previousTotal = prevMonthTotal.length > 0 ? prevMonthTotal[0].total : 0;
    const changePercentage = previousTotal > 0 
      ? ((currentMonthTotal - previousTotal) / previousTotal) * 100 
      : 0;

    res.json({
      success: true,
      summary: {
        currentMonthTotal,
        previousMonthTotal: previousTotal,
        changePercentage: Math.round(changePercentage * 100) / 100,
        upcomingRecurring: upcomingRecurring.length,
        expectedAmount: upcomingRecurring.reduce((sum, income) => sum + income.amount, 0)
      }
    });

  } catch (error) {
    console.error('Income summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching income summary.'
    });
  }
});

// @route   GET /api/income/recurring/upcoming
// @desc    Get upcoming recurring income
// @access  Private
router.get('/recurring/upcoming', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const upcomingIncome = await Income.getUpcomingRecurringIncome(req.user._id, parseInt(days));

    res.json({
      success: true,
      upcomingIncome
    });

  } catch (error) {
    console.error('Upcoming income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming income.'
    });
  }
});

module.exports = router;

