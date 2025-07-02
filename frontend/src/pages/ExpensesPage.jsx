import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Receipt } from 'lucide-react';

const ExpensesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your spending
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Expense Tracking
          </CardTitle>
          <CardDescription>
            This page will contain expense tracking functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Expense Management</h3>
            <p className="text-muted-foreground mb-4">
              Add, edit, and categorize your expenses with smart AI suggestions.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPage;

