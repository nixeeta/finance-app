const express = require('express');
const { auth } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Goal = require('../models/Goal');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'month' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
        
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
        
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    // Get current period data
    const [
      currentExpenses,
      currentIncome,
      prevExpenses,
      prevIncome,
      categoryExpenses,
      sourceIncome,
      goalStats,
      recentTransactions
    ] = await Promise.all([
      // Current period expenses
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Current period income
      Income.aggregate([
        { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Previous period expenses
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Previous period income
      Income.aggregate([
        { $match: { user: userId, date: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Category-wise expenses
      Expense.getCategoryWiseExpenses(userId, startDate, endDate),
      
      // Source-wise income
      Income.getSourceWiseIncome(userId, startDate, endDate),
      
      // Goal statistics
      Goal.getUserGoalStats(userId),
      
      // Recent transactions (last 10)
      Promise.all([
        Expense.find({ user: userId }).sort({ date: -1 }).limit(5),
        Income.find({ user: userId }).sort({ date: -1 }).limit(5)
      ])
    ]);

    // Process data
    const currentExpenseTotal = currentExpenses[0]?.total || 0;
    const currentIncomeTotal = currentIncome[0]?.total || 0;
    const prevExpenseTotal = prevExpenses[0]?.total || 0;
    const prevIncomeTotal = prevIncome[0]?.total || 0;

    const expenseChange = prevExpenseTotal > 0 
      ? ((currentExpenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100 
      : 0;
    
    const incomeChange = prevIncomeTotal > 0 
      ? ((currentIncomeTotal - prevIncomeTotal) / prevIncomeTotal) * 100 
      : 0;

    const netSavings = currentIncomeTotal - currentExpenseTotal;
    const savingsRate = currentIncomeTotal > 0 ? (netSavings / currentIncomeTotal) * 100 : 0;

    // Budget utilization
    const budgetUtilization = req.user.monthlyBudget > 0 
      ? (currentExpenseTotal / req.user.monthlyBudget) * 100 
      : 0;

    // Combine and sort recent transactions
    const allTransactions = [
      ...recentTransactions[0].map(exp => ({ ...exp.toObject(), type: 'expense' })),
      ...recentTransactions[1].map(inc => ({ ...inc.toObject(), type: 'income' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      dashboard: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalExpenses: currentExpenseTotal,
          totalIncome: currentIncomeTotal,
          netSavings,
          savingsRate: Math.round(savingsRate * 100) / 100,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          expenseChange: Math.round(expenseChange * 100) / 100,
          incomeChange: Math.round(incomeChange * 100) / 100,
          transactionCount: (currentExpenses[0]?.count || 0) + (currentIncome[0]?.count || 0)
        },
        categoryBreakdown: categoryExpenses,
        incomeBreakdown: sourceIncome,
        goalStats,
        recentTransactions: allTransactions
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard analytics.'
    });
  }
});

// @route   GET /api/analytics/spending-patterns
// @desc    Get detailed spending pattern analysis
// @access  Private
router.get('/spending-patterns', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get spending patterns
    const [
      monthlyTrend,
      weeklyPattern,
      categoryTrend,
      paymentMethodBreakdown,
      averageTransactionSize
    ] = await Promise.all([
      // Monthly spending trend
      Expense.getMonthlyTrend(userId, parseInt(months)),
      
      // Weekly spending pattern (day of week)
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dayOfWeek: '$date' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Category trend over time
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              category: '$category',
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      
      // Payment method breakdown
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: '$paymentMethod',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Average transaction size by category
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: '$category',
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { avgAmount: -1 } }
      ])
    ]);

    // Process weekly pattern (convert day numbers to names)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPatternFormatted = weeklyPattern.map(day => ({
      day: dayNames[day._id - 1],
      dayNumber: day._id,
      totalAmount: day.totalAmount,
      count: day.count,
      avgAmount: Math.round(day.avgAmount * 100) / 100
    }));

    res.json({
      success: true,
      patterns: {
        monthlyTrend,
        weeklyPattern: weeklyPatternFormatted,
        categoryTrend,
        paymentMethodBreakdown,
        averageTransactionSize
      }
    });

  } catch (error) {
    console.error('Spending patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching spending patterns.'
    });
  }
});

// @route   GET /api/analytics/budget-analysis
// @desc    Get budget analysis and recommendations
// @access  Private
router.get('/budget-analysis', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    // Current month data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [
      currentMonthExpenses,
      categoryExpenses,
      dailySpending,
      projectedSpending
    ] = await Promise.all([
      // Current month total expenses
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Category-wise current month expenses
      Expense.getCategoryWiseExpenses(userId, startOfMonth, endOfMonth),
      
      // Daily spending this month
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        {
          $group: {
            _id: { $dayOfMonth: '$date' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Calculate projected spending based on current rate
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const currentTotal = currentMonthExpenses[0]?.total || 0;
    const monthlyBudget = user.monthlyBudget || 0;
    
    // Calculate budget metrics
    const budgetUtilization = monthlyBudget > 0 ? (currentTotal / monthlyBudget) * 100 : 0;
    const remainingBudget = monthlyBudget - currentTotal;
    
    // Calculate daily average and projection
    const daysInMonth = endOfMonth.getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    
    const dailyAverage = currentDay > 0 ? currentTotal / currentDay : 0;
    const projectedMonthlyTotal = dailyAverage * daysInMonth;
    const projectedOverspend = projectedMonthlyTotal - monthlyBudget;
    
    // Recommended daily spending for remaining days
    const recommendedDailySpending = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

    // Budget status
    let budgetStatus = 'on-track';
    if (budgetUtilization > 100) {
      budgetStatus = 'over-budget';
    } else if (budgetUtilization > 80) {
      budgetStatus = 'warning';
    } else if (projectedMonthlyTotal > monthlyBudget) {
      budgetStatus = 'projected-overspend';
    }

    // Category budget recommendations (suggest 50/30/20 rule adaptation for students)
    const suggestedCategoryBudgets = {
      food: monthlyBudget * 0.35, // 35% for food (higher for students)
      transport: monthlyBudget * 0.15, // 15% for transport
      entertainment: monthlyBudget * 0.20, // 20% for entertainment/social
      education: monthlyBudget * 0.15, // 15% for education
      other: monthlyBudget * 0.15 // 15% for other expenses
    };

    res.json({
      success: true,
      budgetAnalysis: {
        monthlyBudget,
        currentSpending: currentTotal,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        remainingBudget,
        budgetStatus,
        dailyMetrics: {
          dailyAverage: Math.round(dailyAverage * 100) / 100,
          recommendedDailySpending: Math.round(recommendedDailySpending * 100) / 100,
          daysRemaining
        },
        projections: {
          projectedMonthlyTotal: Math.round(projectedMonthlyTotal * 100) / 100,
          projectedOverspend: Math.round(projectedOverspend * 100) / 100
        },
        categoryBreakdown: categoryExpenses,
        suggestedCategoryBudgets,
        dailySpending
      }
    });

  } catch (error) {
    console.error('Budget analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget analysis.'
    });
  }
});

// @route   GET /api/analytics/financial-health
// @desc    Get overall financial health score and insights
// @access  Private
router.get('/financial-health', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    // Get data for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [
      totalExpenses,
      totalIncome,
      goalStats,
      savingsGoals,
      expenseVariability
    ] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: threeMonthsAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      Income.aggregate([
        { $match: { user: userId, date: { $gte: threeMonthsAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      Goal.getUserGoalStats(userId),
      
      Goal.find({ user: userId, status: 'active' }),
      
      // Calculate expense variability (standard deviation)
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: threeMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            monthlyTotal: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const expenses = totalExpenses[0]?.total || 0;
    const income = totalIncome[0]?.total || 0;
    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    // Calculate financial health score (0-100)
    let healthScore = 0;
    const scoreFactors = [];

    // Factor 1: Savings Rate (30 points)
    if (savingsRate >= 20) {
      healthScore += 30;
      scoreFactors.push({ factor: 'Excellent savings rate', points: 30, status: 'excellent' });
    } else if (savingsRate >= 10) {
      healthScore += 20;
      scoreFactors.push({ factor: 'Good savings rate', points: 20, status: 'good' });
    } else if (savingsRate >= 0) {
      healthScore += 10;
      scoreFactors.push({ factor: 'Positive savings', points: 10, status: 'fair' });
    } else {
      scoreFactors.push({ factor: 'Negative savings', points: 0, status: 'poor' });
    }

    // Factor 2: Budget Adherence (25 points)
    const budgetUtilization = await user.getBudgetUtilization();
    if (budgetUtilization <= 80) {
      healthScore += 25;
      scoreFactors.push({ factor: 'Excellent budget control', points: 25, status: 'excellent' });
    } else if (budgetUtilization <= 100) {
      healthScore += 15;
      scoreFactors.push({ factor: 'Good budget control', points: 15, status: 'good' });
    } else if (budgetUtilization <= 120) {
      healthScore += 5;
      scoreFactors.push({ factor: 'Slight budget overspend', points: 5, status: 'fair' });
    } else {
      scoreFactors.push({ factor: 'Significant budget overspend', points: 0, status: 'poor' });
    }

    // Factor 3: Goal Progress (20 points)
    const activeGoals = goalStats.active.count;
    const completedGoals = goalStats.completed.count;
    const totalGoalProgress = activeGoals > 0 ? (goalStats.active.totalCurrent / goalStats.active.totalTarget) * 100 : 0;
    
    if (completedGoals > 0 && totalGoalProgress >= 50) {
      healthScore += 20;
      scoreFactors.push({ factor: 'Excellent goal achievement', points: 20, status: 'excellent' });
    } else if (totalGoalProgress >= 25) {
      healthScore += 15;
      scoreFactors.push({ factor: 'Good goal progress', points: 15, status: 'good' });
    } else if (activeGoals > 0) {
      healthScore += 10;
      scoreFactors.push({ factor: 'Goals set but limited progress', points: 10, status: 'fair' });
    } else {
      scoreFactors.push({ factor: 'No active financial goals', points: 0, status: 'poor' });
    }

    // Factor 4: Expense Consistency (15 points)
    const monthlyExpenses = expenseVariability.map(m => m.monthlyTotal);
    if (monthlyExpenses.length >= 2) {
      const avgExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
      const variance = monthlyExpenses.reduce((sum, expense) => sum + Math.pow(expense - avgExpense, 2), 0) / monthlyExpenses.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgExpense > 0 ? (stdDev / avgExpense) * 100 : 0;
      
      if (coefficientOfVariation <= 20) {
        healthScore += 15;
        scoreFactors.push({ factor: 'Consistent spending patterns', points: 15, status: 'excellent' });
      } else if (coefficientOfVariation <= 40) {
        healthScore += 10;
        scoreFactors.push({ factor: 'Moderately consistent spending', points: 10, status: 'good' });
      } else {
        healthScore += 5;
        scoreFactors.push({ factor: 'Inconsistent spending patterns', points: 5, status: 'fair' });
      }
    }

    // Factor 5: Emergency Fund (10 points)
    const emergencyFundGoal = savingsGoals.find(goal => goal.category === 'emergency-fund');
    if (emergencyFundGoal && emergencyFundGoal.currentAmount >= emergencyFundGoal.targetAmount * 0.5) {
      healthScore += 10;
      scoreFactors.push({ factor: 'Emergency fund in progress', points: 10, status: 'good' });
    } else if (emergencyFundGoal) {
      healthScore += 5;
      scoreFactors.push({ factor: 'Emergency fund started', points: 5, status: 'fair' });
    } else {
      scoreFactors.push({ factor: 'No emergency fund', points: 0, status: 'poor' });
    }

    // Determine overall health status
    let healthStatus = 'poor';
    if (healthScore >= 80) healthStatus = 'excellent';
    else if (healthScore >= 60) healthStatus = 'good';
    else if (healthScore >= 40) healthStatus = 'fair';

    // Generate recommendations
    const recommendations = [];
    if (savingsRate < 10) {
      recommendations.push('Try to save at least 10% of your income each month');
    }
    if (budgetUtilization > 100) {
      recommendations.push('Review and reduce expenses to stay within budget');
    }
    if (activeGoals === 0) {
      recommendations.push('Set specific financial goals to improve motivation');
    }
    if (!emergencyFundGoal) {
      recommendations.push('Start building an emergency fund for unexpected expenses');
    }

    res.json({
      success: true,
      financialHealth: {
        healthScore: Math.round(healthScore),
        healthStatus,
        scoreFactors,
        metrics: {
          savingsRate: Math.round(savingsRate * 100) / 100,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          activeGoals,
          completedGoals,
          totalGoalProgress: Math.round(totalGoalProgress * 100) / 100
        },
        recommendations
      }
    });

  } catch (error) {
    console.error('Financial health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating financial health.'
    });
  }
});

module.exports = router;

