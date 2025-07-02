const express = require('express');
const { auth } = require('../middleware/auth');
const Expense = require('../models/Expense');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      amount,
      description,
      category,
      subcategory,
      tags,
      date,
      paymentMethod,
      location,
      isRecurring,
      recurringFrequency,
      notes
    } = req.body;

    // Validation
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required.'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.'
      });
    }

    // Create expense object
    const expenseData = {
      user: req.user._id,
      amount: parseFloat(amount),
      description: description.trim(),
      category: category || 'other',
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'other'
    };

    // Add optional fields
    if (subcategory) expenseData.subcategory = subcategory.trim();
    if (tags && Array.isArray(tags)) expenseData.tags = tags.map(tag => tag.trim());
    if (location) expenseData.location = location.trim();
    if (isRecurring) expenseData.isRecurring = isRecurring;
    if (recurringFrequency) expenseData.recurringFrequency = recurringFrequency;
    if (notes) expenseData.notes = notes.trim();

    const expense = new Expense(expenseData);

    // Auto-suggest category if not provided or is 'other'
    if (!category || category === 'other') {
      const suggestedCategory = expense.suggestCategory();
      expense.category = suggestedCategory;
      expense.aiGenerated = true;
      expense.aiConfidence = 0.8;
    }

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense added successfully!',
      expense
    });

  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expense.'
    });
  }
});

// @route   GET /api/expenses
// @desc    Get user's expenses with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
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

    if (category && category !== 'all') {
      filter.category = category;
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
        { notes: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalExpenses: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses.'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a specific expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    res.json({
      success: true,
      expense
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense.'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      amount,
      description,
      category,
      subcategory,
      tags,
      date,
      paymentMethod,
      location,
      isRecurring,
      recurringFrequency,
      notes
    } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
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
      expense.amount = parseFloat(amount);
    }

    if (description) expense.description = description.trim();
    if (category) expense.category = category;
    if (subcategory) expense.subcategory = subcategory.trim();
    if (tags && Array.isArray(tags)) expense.tags = tags.map(tag => tag.trim());
    if (date) expense.date = new Date(date);
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (location) expense.location = location.trim();
    if (isRecurring !== undefined) expense.isRecurring = isRecurring;
    if (recurringFrequency) expense.recurringFrequency = recurringFrequency;
    if (notes) expense.notes = notes.trim();

    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully!',
      expense
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense.'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully!'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense.'
    });
  }
});

// @route   GET /api/expenses/analytics/category-wise
// @desc    Get category-wise expense analytics
// @access  Private
router.get('/analytics/category-wise', auth, async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

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

    const categoryData = await Expense.getCategoryWiseExpenses(req.user._id, start, end);

    res.json({
      success: true,
      data: categoryData,
      period: { start, end }
    });

  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category analytics.'
    });
  }
});

// @route   GET /api/expenses/analytics/monthly-trend
// @desc    Get monthly spending trend
// @access  Private
router.get('/analytics/monthly-trend', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const trendData = await Expense.getMonthlyTrend(req.user._id, parseInt(months));

    res.json({
      success: true,
      data: trendData
    });

  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly trend.'
    });
  }
});

// @route   POST /api/expenses/bulk
// @desc    Add multiple expenses at once
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expenses.'
      });
    }

    // Validate and prepare expenses
    const validExpenses = [];
    const errors = [];

    for (let i = 0; i < expenses.length; i++) {
      const expenseData = expenses[i];
      
      if (!expenseData.amount || !expenseData.description) {
        errors.push(`Expense ${i + 1}: Amount and description are required.`);
        continue;
      }

      if (expenseData.amount <= 0) {
        errors.push(`Expense ${i + 1}: Amount must be greater than 0.`);
        continue;
      }

      const expense = new Expense({
        user: req.user._id,
        amount: parseFloat(expenseData.amount),
        description: expenseData.description.trim(),
        category: expenseData.category || 'other',
        date: expenseData.date ? new Date(expenseData.date) : new Date(),
        paymentMethod: expenseData.paymentMethod || 'other',
        subcategory: expenseData.subcategory?.trim(),
        tags: expenseData.tags?.map(tag => tag.trim()) || [],
        location: expenseData.location?.trim(),
        notes: expenseData.notes?.trim()
      });

      // Auto-suggest category if needed
      if (!expenseData.category || expenseData.category === 'other') {
        expense.category = expense.suggestCategory();
        expense.aiGenerated = true;
        expense.aiConfidence = 0.8;
      }

      validExpenses.push(expense);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found.',
        errors
      });
    }

    // Save all valid expenses
    const savedExpenses = await Expense.insertMany(validExpenses);

    res.status(201).json({
      success: true,
      message: `${savedExpenses.length} expenses added successfully!`,
      expenses: savedExpenses
    });

  } catch (error) {
    console.error('Bulk add expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expenses.'
    });
  }
});

module.exports = router;

