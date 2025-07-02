# BrokeAF - Personal Finance Tracker for Students

## 🎯 Project Overview

**BrokeAF (BrokeAndFocused)** is a comprehensive personal finance management application specifically designed for students and young professionals who need to manage their finances effectively while pursuing their education. The application provides an intuitive interface for tracking expenses, managing income, setting financial goals, and gaining insights through AI-powered analytics.

### 🌟 Project Significance

In today's economic climate, financial literacy and management skills are crucial for students who often operate on tight budgets. BrokeAF addresses this need by providing:

- **Student-Centric Design**: Features tailored specifically for student financial patterns and needs
- **Educational Value**: Helps users develop healthy financial habits early in their careers
- **Accessibility**: Free, open-source solution that doesn't require expensive subscriptions
- **Modern Technology Stack**: Built with cutting-edge web technologies for optimal performance
- **AI Integration**: Leverages artificial intelligence to provide personalized financial insights

## ✨ Key Features

### 📊 Expense Tracking
- **Categorized Expenses**: Organize spending into customizable categories (Food, Transportation, Books, Entertainment, etc.)
- **Receipt Management**: Upload and store digital receipts for better record-keeping
- **Real-time Updates**: Instant synchronization across all devices
- **Bulk Import**: Import expenses from bank statements or CSV files

### 💰 Income Management
- **Multiple Income Sources**: Track various income streams (part-time jobs, scholarships, allowances, freelancing)
- **Recurring Income**: Set up automatic tracking for regular income sources
- **Income Forecasting**: Predict future income based on historical data

### 🎯 Goal Setting & Tracking
- **SMART Goals**: Create Specific, Measurable, Achievable, Relevant, Time-bound financial goals
- **Progress Visualization**: Visual progress bars and charts to track goal achievement
- **Milestone Celebrations**: Gamified experience with achievements and milestones
- **Emergency Fund Planning**: Specialized tools for building emergency savings

### 📈 Analytics & Insights
- **Spending Patterns**: Detailed analysis of spending habits and trends
- **Budget vs. Actual**: Compare planned budgets with actual spending
- **Monthly/Weekly Reports**: Comprehensive financial reports with actionable insights
- **Predictive Analytics**: AI-powered predictions for future spending patterns

### 🤖 AI-Powered Features
- **Smart Categorization**: Automatic expense categorization using machine learning
- **Personalized Recommendations**: AI-driven suggestions for budget optimization
- **Financial Health Score**: Comprehensive assessment of financial well-being
- **Weekly Summaries**: Automated weekly financial summaries and insights

### 🔐 Security & Privacy
- **End-to-End Encryption**: All financial data is encrypted both in transit and at rest
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Privacy First**: No data sharing with third parties without explicit consent
- **GDPR Compliant**: Full compliance with data protection regulations

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment for server-side JavaScript
- **Express.js**: Fast, unopinionated web framework for Node.js
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: Elegant MongoDB object modeling for Node.js
- **JWT**: JSON Web Tokens for secure authentication
- **bcryptjs**: Password hashing for enhanced security
- **node-cron**: Task scheduling for automated processes

### Frontend
- **React 19**: Latest version of the popular UI library
- **Vite**: Next-generation frontend tooling for fast development
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Low-level UI primitives for building design systems
- **React Router DOM**: Declarative routing for React applications
- **Recharts**: Composable charting library for React
- **Framer Motion**: Production-ready motion library for React

### Development Tools
- **ESLint**: Code linting for maintaining code quality
- **Concurrently**: Run multiple commands concurrently during development
- **Nodemon**: Automatic server restart during development

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/nixeeta/finance-app.git
```

### Step 2: Install Dependencies

Install all project dependencies using the provided script:

```bash
npm run install:all
```

This command will:
1. Install root-level dependencies
2. Install backend dependencies
3. Install frontend dependencies

### Step 3: Environment Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/brokeaf
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:5173
   ```

### Step 4: Database Setup

1. Start MongoDB service:
   ```bash
   # Windows (if MongoDB is installed as a service)
   net start MongoDB
   
   # Or start manually
   mongod
   ```

2. The application will automatically create the necessary database and collections on first run.

### Step 5: Start the Application

#### Development Mode (Recommended)

Start both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:5173`

#### Production Mode

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

## 📖 Usage Instructions

### Getting Started

1. **Registration**: Create a new account by providing your name, email, college, course, and monthly budget
2. **Profile Setup**: Complete your profile with additional information for personalized insights
3. **First Expense**: Add your first expense to start tracking your spending
4. **Set Goals**: Create your first financial goal to stay motivated

### Daily Usage

1. **Add Expenses**: Quickly add expenses using the intuitive form interface
2. **Review Dashboard**: Check your daily spending summary on the dashboard
3. **Monitor Budget**: Keep track of your budget utilization throughout the month
4. **Check Goals**: Review progress on your financial goals

### Weekly Routine

1. **Review Analytics**: Analyze your weekly spending patterns
2. **Read AI Insights**: Review AI-generated insights and recommendations
3. **Adjust Budget**: Make necessary adjustments to your budget based on insights
4. **Plan Ahead**: Set spending plans for the upcoming week

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/brokeaf` | Yes |
| `PORT` | Backend server port | `5000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` | No |

### User Preferences

Users can customize their experience through the settings panel:

- **Currency**: Choose from multiple supported currencies
- **Theme**: Light, dark, or system theme
- **Notifications**: Enable/disable various notification types
- **Privacy**: Control data sharing and analytics preferences

## 🧪 Testing

### Running Tests

Currently, the project uses manual testing. To test the application:

1. Start the development environment:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173` in your browser

3. Test the following workflows:
   - User registration and login
   - Adding and editing expenses
   - Setting and tracking goals
   - Viewing analytics and reports

### API Testing

Test the backend API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:5000/api/health

# User registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

### Local Deployment

For local deployment with production settings:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set environment to production:
   ```env
   NODE_ENV=production
   ```

3. Start the server:
   ```bash
   npm start
   ```