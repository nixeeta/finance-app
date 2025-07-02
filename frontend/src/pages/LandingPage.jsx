import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  Brain,
  BarChart3,
  MessageCircle,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  Github,
  Star,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Smart categorization and personalized financial advice powered by AI',
      color: 'text-purple-500',
    },
    {
      icon: BarChart3,
      title: 'Visual Analytics',
      description: 'Beautiful charts and graphs that make your spending patterns clear',
      color: 'text-blue-500',
    },
    {
      icon: MessageCircle,
      title: 'Chat Interface',
      description: 'Log expenses and get tips through our friendly chatbot',
      color: 'text-green-500',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'No trackers, no ads, no data mining. Your data stays yours',
      color: 'text-red-500',
    },
    {
      icon: Smartphone,
      title: 'Offline Ready',
      description: 'Works even without internet - perfect for hostels and metros',
      color: 'text-orange-500',
    },
    {
      icon: Target,
      title: 'Smart Goals',
      description: 'Set and track savings goals with automated progress tracking',
      color: 'text-indigo-500',
    },
  ];

  const stats = [
    { label: 'Students Helped', value: '10K+' },
    { label: 'Money Saved', value: '₹50L+' },
    { label: 'Goals Achieved', value: '5K+' },
    { label: 'Open Source', value: '100%' },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'CS Student, IIT Delhi',
      content: 'BrokeAF helped me save ₹15,000 in just 3 months! The AI insights are spot on.',
      rating: 5,
    },
    {
      name: 'Rahul Kumar',
      role: 'MBA Student, IIM Bangalore',
      content: 'Finally, a finance app that understands student life. Love the chat feature!',
      rating: 5,
    },
    {
      name: 'Ananya Patel',
      role: 'Engineering Student, NIT Trichy',
      content: 'The offline feature is a lifesaver in my hostel. Best finance app for students!',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BrokeAF</span>
              <Badge variant="secondary" className="ml-2">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Built for the{' '}
                <span className="text-primary">broke</span>.{' '}
                <br />
                Designed for the{' '}
                <span className="text-primary">focused</span>.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                BrokeAndFocused (BrokeAF) is an AI-powered personal finance app designed specifically for students. 
                Track expenses, manage budgets, and achieve your financial goals without the complexity.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/register">
                  <Button size="lg" className="px-8">
                    Start Tracking Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage your finances
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed specifically for student life and budget constraints.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${feature.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why BrokeAF Section */}
      <section className="py-20 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why BrokeAF is different
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most finance apps aren't built for students. We are.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Student-Focused Categories</h3>
                    <p className="text-muted-foreground">
                      Pre-built categories for food, transport, party, education, and more that actually matter to students.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Irregular Income Support</h3>
                    <p className="text-muted-foreground">
                      Handle stipends, allowances, part-time jobs, and freelance income with ease.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">No Subscription Fees</h3>
                    <p className="text-muted-foreground">
                      Completely free and open-source. No hidden costs or premium features.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">AI That Understands Students</h3>
                    <p className="text-muted-foreground">
                      Smart insights tailored for student spending patterns and financial goals.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Works Offline</h3>
                    <p className="text-muted-foreground">
                      Perfect for hostels and areas with poor internet connectivity.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Privacy Focused</h3>
                    <p className="text-muted-foreground">
                      Your financial data stays private. No tracking, no ads, no data selling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by students across India
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what students are saying about BrokeAF.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to take control of your finances?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join thousands of students who are already managing their money better with BrokeAF.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">BrokeAF</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">GitHub</a>
              <a href="#" className="hover:text-foreground">Support</a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 BrokeAF. Built with ❤️ for students, by students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

