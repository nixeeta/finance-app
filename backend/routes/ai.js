const express = require('express');
const { auth } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Goal = require('../models/Goal');
const User = require('../models/User');

const router = express.Router();

// Mock AI responses for demo purposes
// In production, this would integrate with OpenAI GPT-4 API

// @route   POST /api/ai/chat
// @desc    Get AI chat response for financial queries
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user's recent financial data for context
    const [recentExpenses, recentIncome, activeGoals] = await Promise.all([
      Expense.find({ user: userId }).sort({ date: -1 }).limit(10),
      Income.find({ user: userId }).sort({ date: -1 }).limit(5),
      Goal.find({ user: userId, status: 'active' }).limit(3)
    ]);

    // Generate contextual AI response based on message content
    let aiResponse = generateAIResponse(message.toLowerCase(), {
      expenses: recentExpenses,
      income: recentIncome,
      goals: activeGoals,
      user: req.user
    });

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing AI request.'
    });
  }
});

// @route   GET /api/ai/weekly-summary
// @desc    Get AI-generated weekly financial summary
// @access  Private
router.get('/weekly-summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get last week's data
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const [weeklyExpenses, weeklyIncome, goalProgress] = await Promise.all([
      Expense.find({ 
        user: userId, 
        date: { $gte: lastWeek } 
      }),
      Income.find({ 
        user: userId, 
        date: { $gte: lastWeek } 
      }),
      Goal.find({ user: userId, status: 'active' })
    ]);

    const summary = generateWeeklySummary({
      expenses: weeklyExpenses,
      income: weeklyIncome,
      goals: goalProgress,
      user: req.user
    });

    res.json({
      success: true,
      summary,
      period: {
        start: lastWeek,
        end: new Date()
      }
    });

  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating weekly summary.'
    });
  }
});

// @route   GET /api/ai/insights
// @desc    Get AI-powered financial insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get last month's data for insights
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [monthlyExpenses, monthlyIncome, categoryData] = await Promise.all([
      Expense.find({ 
        user: userId, 
        date: { $gte: lastMonth } 
      }),
      Income.find({ 
        user: userId, 
        date: { $gte: lastMonth } 
      }),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: lastMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const insights = generateFinancialInsights({
      expenses: monthlyExpenses,
      income: monthlyIncome,
      categoryData,
      user: req.user
    });

    res.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating insights.'
    });
  }
});

// @route   GET /api/ai/budget-suggestions
// @desc    Get AI-powered budget suggestions
// @access  Private
router.get('/budget-suggestions', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get spending patterns
    const spendingData = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', avgAmount: { $avg: '$amount' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const suggestions = generateBudgetSuggestions({
      spendingData,
      monthlyBudget: req.user.monthlyBudget,
      user: req.user
    });

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Budget suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating budget suggestions.'
    });
  }
});

// Helper function to generate AI chat responses
function generateAIResponse(message, context) {
  const { expenses, income, goals, user } = context;
  
  // Expense-related queries
  if (message.includes('spend') || message.includes('expense')) {
    if (expenses.length === 0) {
      return "I notice you haven't logged any expenses yet! 📝 Start by adding your daily expenses to get personalized insights. Try logging something like 'Coffee ₹50' or 'Lunch ₹150'.";
    }
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const topCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    const maxCategory = Object.keys(topCategory).reduce((a, b) => 
      topCategory[a] > topCategory[b] ? a : b
    );
    
    return `Based on your recent expenses, you've spent ₹${totalExpenses.toLocaleString()} recently. Your biggest spending category is ${maxCategory} (₹${topCategory[maxCategory].toLocaleString()}). 💡 Tip: Try setting a weekly limit for your top spending categories!`;
  }
  
  // Income-related queries
  if (message.includes('income') || message.includes('earn')) {
    if (income.length === 0) {
      return "I don't see any income entries yet! 💰 Add your allowance, stipend, or part-time job income to get better budget insights. This helps me understand your financial capacity.";
    }
    
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    return `Your recent income is ₹${totalIncome.toLocaleString()}. ${totalIncome > 0 ? "Great job on earning! 🎉" : ""} Remember to track all income sources including allowances, scholarships, and part-time work for accurate budgeting.`;
  }
  
  // Goal-related queries
  if (message.includes('goal') || message.includes('save')) {
    if (goals.length === 0) {
      return "You haven't set any savings goals yet! 🎯 Setting specific goals like 'Emergency Fund ₹10,000' or 'New Laptop ₹50,000' can really help with motivation. Want me to help you create your first goal?";
    }
    
    const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const progressPercent = totalGoalTarget > 0 ? (totalGoalProgress / totalGoalTarget * 100).toFixed(1) : 0;
    
    return `You're ${progressPercent}% towards your savings goals! 🌟 You've saved ₹${totalGoalProgress.toLocaleString()} out of ₹${totalGoalTarget.toLocaleString()}. Keep it up! Small consistent savings make a big difference.`;
  }
  
  // Budget-related queries
  if (message.includes('budget')) {
    const monthlyBudget = user.monthlyBudget || 0;
    if (monthlyBudget === 0) {
      return "I notice you haven't set a monthly budget yet! 📊 Setting a budget is crucial for financial health. Based on typical student expenses, consider budgeting for food (35%), transport (15%), entertainment (20%), and savings (15%). Want help setting up your first budget?";
    }
    
    return `Your monthly budget is ₹${monthlyBudget.toLocaleString()}. 📈 For students, I recommend the 50/30/20 rule adapted: 50% for needs (food, transport), 30% for wants (entertainment, shopping), and 20% for savings and goals. How's your current spending compared to this?`;
  }
  
  // General financial advice
  if (message.includes('help') || message.includes('advice') || message.includes('tip')) {
    const tips = [
      "💡 Track every expense, no matter how small! Even that ₹10 chai adds up over time.",
      "🎯 Set specific, measurable goals. Instead of 'save money', try 'save ₹5,000 for emergency fund by December'.",
      "📱 Use the 24-hour rule for non-essential purchases above ₹500. Sleep on it before buying!",
      "🍕 Cook more, order less. Cooking can save you 60-70% on food expenses.",
      "📚 Take advantage of student discounts everywhere - software, transport, entertainment!",
      "💰 Start an emergency fund with just ₹100/month. Small amounts compound over time.",
      "📊 Review your spending weekly. Awareness is the first step to better financial habits."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Default response
  return "I'm here to help with your finances! 🤖 You can ask me about your spending patterns, savings goals, budget advice, or general financial tips. Try asking 'How much did I spend this week?' or 'Give me a money-saving tip!'";
}

// Helper function to generate weekly summary
function generateWeeklySummary(data) {
  const { expenses, income, goals, user } = data;
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  
  // Category breakdown
  const categorySpending = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  
  const topCategory = Object.keys(categorySpending).reduce((a, b) => 
    categorySpending[a] > categorySpending[b] ? a : b, 'other'
  );
  
  let summary = {
    overview: `This week you spent ₹${totalExpenses.toLocaleString()} and earned ₹${totalIncome.toLocaleString()}.`,
    netSavings: netSavings,
    topSpendingCategory: topCategory,
    insights: [],
    recommendations: []
  };
  
  // Generate insights
  if (netSavings > 0) {
    summary.insights.push(`Great job! You saved ₹${netSavings.toLocaleString()} this week. 🎉`);
  } else if (netSavings < 0) {
    summary.insights.push(`You overspent by ₹${Math.abs(netSavings).toLocaleString()} this week. Let's work on reducing expenses.`);
  }
  
  if (topCategory && categorySpending[topCategory] > 0) {
    summary.insights.push(`Your biggest expense category was ${topCategory} (₹${categorySpending[topCategory].toLocaleString()}).`);
  }
  
  // Generate recommendations
  if (totalExpenses > (user.monthlyBudget || 0) / 4) {
    summary.recommendations.push("Consider reducing discretionary spending to stay within your monthly budget.");
  }
  
  if (expenses.length < 7) {
    summary.recommendations.push("Try to log expenses daily for better tracking accuracy.");
  }
  
  summary.recommendations.push("Set aside 20% of any income for savings and emergency fund.");
  
  return summary;
}

// Helper function to generate financial insights
function generateFinancialInsights(data) {
  const { expenses, income, categoryData, user } = data;
  
  const insights = [];
  
  // Spending pattern insights
  if (categoryData.length > 0) {
    const topCategory = categoryData[0];
    insights.push({
      type: 'spending_pattern',
      title: 'Top Spending Category',
      description: `You spend the most on ${topCategory._id} (₹${topCategory.total.toLocaleString()})`,
      suggestion: `Consider setting a monthly limit for ${topCategory._id} expenses.`
    });
  }
  
  // Budget utilization
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyBudget = user.monthlyBudget || 0;
  
  if (monthlyBudget > 0) {
    const utilization = (totalExpenses / monthlyBudget) * 100;
    insights.push({
      type: 'budget_health',
      title: 'Budget Utilization',
      description: `You've used ${utilization.toFixed(1)}% of your monthly budget`,
      suggestion: utilization > 80 ? 'Consider reducing expenses to stay within budget' : 'Good budget management!'
    });
  }
  
  // Savings potential
  const totalIncome = income.reduce((sum, inc) => inc.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  insights.push({
    type: 'savings_potential',
    title: 'Savings Rate',
    description: `Your current savings rate is ${savingsRate.toFixed(1)}%`,
    suggestion: savingsRate < 20 ? 'Try to save at least 20% of your income' : 'Excellent savings discipline!'
  });
  
  return insights;
}

// Helper function to generate budget suggestions
function generateBudgetSuggestions(data) {
  const { spendingData, monthlyBudget, user } = data;
  
  const suggestions = [];
  
  // Student-specific budget allocation
  const studentBudgetAllocation = {
    food: 0.35,
    transport: 0.15,
    entertainment: 0.20,
    education: 0.15,
    other: 0.15
  };
  
  if (monthlyBudget > 0) {
    Object.keys(studentBudgetAllocation).forEach(category => {
      const suggestedAmount = monthlyBudget * studentBudgetAllocation[category];
      suggestions.push({
        category,
        suggestedAmount,
        description: `Allocate ₹${suggestedAmount.toLocaleString()} for ${category} (${(studentBudgetAllocation[category] * 100)}% of budget)`
      });
    });
  } else {
    suggestions.push({
      category: 'general',
      description: 'Set a monthly budget to get personalized category-wise suggestions',
      suggestedAmount: 0
    });
  }
  
  // Add general tips
  suggestions.push({
    category: 'tips',
    description: 'Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings',
    suggestedAmount: 0
  });
  
  return suggestions;
}

module.exports = router;

