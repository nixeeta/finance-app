import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com/api' 
    : 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brokeaf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('brokeaf_token');
      localStorage.removeItem('brokeaf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
};

// Expenses API functions
export const expensesAPI = {
  getExpenses: (params) => api.get('/expenses', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  bulkCreateExpenses: (expenses) => api.post('/expenses/bulk', { expenses }),
  getCategoryAnalytics: (params) => api.get('/expenses/analytics/category-wise', { params }),
  getMonthlyTrend: (params) => api.get('/expenses/analytics/monthly-trend', { params }),
};

// Income API functions
export const incomeAPI = {
  getIncomes: (params) => api.get('/income', { params }),
  getIncome: (id) => api.get(`/income/${id}`),
  createIncome: (incomeData) => api.post('/income', incomeData),
  updateIncome: (id, incomeData) => api.put(`/income/${id}`, incomeData),
  deleteIncome: (id) => api.delete(`/income/${id}`),
  getSourceAnalytics: (params) => api.get('/income/analytics/source-wise', { params }),
  getMonthlyTrend: (params) => api.get('/income/analytics/monthly-trend', { params }),
  getSummary: () => api.get('/income/analytics/summary'),
  getUpcomingRecurring: (params) => api.get('/income/recurring/upcoming', { params }),
};

// Goals API functions
export const goalsAPI = {
  getGoals: (params) => api.get('/goals', { params }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.put(`/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, contributionData) => api.post(`/goals/${id}/contribute`, contributionData),
  getSummary: () => api.get('/goals/analytics/summary'),
  getOverdueGoals: () => api.get('/goals/overdue'),
  processAutoSave: (id) => api.post(`/goals/${id}/auto-save`),
};

// Analytics API functions
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getSpendingPatterns: (params) => api.get('/analytics/spending-patterns', { params }),
  getBudgetAnalysis: () => api.get('/analytics/budget-analysis'),
  getFinancialHealth: () => api.get('/analytics/financial-health'),
};

// AI API functions (to be implemented)
export const aiAPI = {
  getChatResponse: (message) => api.post('/ai/chat', { message }),
  getWeeklySummary: () => api.get('/ai/weekly-summary'),
  getInsights: () => api.get('/ai/insights'),
  generateBudgetSuggestions: () => api.get('/ai/budget-suggestions'),
};

// Utility functions
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

export const getCategoryIcon = (category) => {
  const icons = {
    food: '🍕',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    education: '📚',
    health: '🏥',
    rent: '🏠',
    utilities: '💡',
    subscriptions: '📱',
    party: '🎉',
    emergency: '🚨',
    other: '📦',
  };
  return icons[category] || icons.other;
};

export const getIncomeSourceIcon = (source) => {
  const icons = {
    allowance: '💰',
    stipend: '🎓',
    scholarship: '🏆',
    'part-time-job': '💼',
    freelance: '💻',
    internship: '🏢',
    family: '👨‍👩‍👧‍👦',
    gift: '🎁',
    investment: '📈',
    'side-hustle': '🚀',
    other: '💵',
  };
  return icons[source] || icons.other;
};

export default api;

