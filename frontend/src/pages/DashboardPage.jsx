import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI, formatCurrency, formatDate, getRelativeTime, getCategoryIcon } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard({ period });
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data. Please try again.</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const {
    summary,
    categoryBreakdown,
    incomeBreakdown,
    goalStats,
    recentTransactions,
  } = dashboardData;

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  // Prepare chart data
  const categoryChartData = categoryBreakdown.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const incomeChartData = incomeBreakdown.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  // Budget status
  const getBudgetStatus = () => {
    if (summary.budgetUtilization <= 70) return { status: 'good', color: 'text-green-500' };
    if (summary.budgetUtilization <= 90) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'danger', color: 'text-red-500' };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview for this {period}
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {summary.expenseChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={summary.expenseChange >= 0 ? 'text-red-500' : 'text-green-500'}>
                  {Math.abs(summary.expenseChange).toFixed(1)}%
                </span>
                <span className="ml-1">from last {period}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {summary.incomeChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={summary.incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(summary.incomeChange).toFixed(1)}%
                </span>
                <span className="ml-1">from last {period}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netSavings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(summary.netSavings)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Savings rate: {summary.savingsRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${budgetStatus.color}`}>
                {summary.budgetUtilization.toFixed(1)}%
              </div>
              <Progress value={Math.min(summary.budgetUtilization, 100)} className="mt-2" />
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {budgetStatus.status === 'good' && <CheckCircle className="h-3 w-3 text-green-500 mr-1" />}
                {budgetStatus.status === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />}
                {budgetStatus.status === 'danger' && <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />}
                <span>
                  {budgetStatus.status === 'good' && 'On track'}
                  {budgetStatus.status === 'warning' && 'Watch spending'}
                  {budgetStatus.status === 'danger' && 'Over budget'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>
                Your spending breakdown for this {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="totalAmount"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                        labelFormatter={(label) => `${getCategoryIcon(label)} ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Income Sources</CardTitle>
              <CardDescription>
                Your income breakdown for this {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="totalAmount"
                      >
                        {incomeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No income data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </div>
              <Link to="/expenses">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          transaction.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {transaction.type === 'expense' 
                            ? getCategoryIcon(transaction.category)
                            : '💰'
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {getRelativeTime(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className={`font-medium ${
                        transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                    <Link to="/expenses">
                      <Button size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Transaction
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Savings Goals</CardTitle>
                <CardDescription>Your progress towards financial goals</CardDescription>
              </div>
              <Link to="/goals">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {goalStats.active?.count || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {goalStats.completed?.count || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
                
                {goalStats.active?.count > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Total Progress</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Saved</span>
                        <span>{formatCurrency(goalStats.active.totalCurrent)}</span>
                      </div>
                      <Progress 
                        value={(goalStats.active.totalCurrent / goalStats.active.totalTarget) * 100} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {formatCurrency(goalStats.active.totalTarget)}</span>
                        <span>
                          {((goalStats.active.totalCurrent / goalStats.active.totalTarget) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active goals</p>
                    <Link to="/goals">
                      <Button size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Create Goal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your finances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/expenses">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Receipt className="h-6 w-6" />
                  <span className="text-sm">Add Expense</span>
                </Button>
              </Link>
              <Link to="/income">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Add Income</span>
                </Button>
              </Link>
              <Link to="/goals">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Set Goal</span>
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardPage;

