import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';

const IncomePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-muted-foreground mt-1">
            Track your income sources and earnings
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Income Tracking
          </CardTitle>
          <CardDescription>
            This page will contain income tracking functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Income Management</h3>
            <p className="text-muted-foreground mb-4">
              Track allowances, stipends, part-time jobs, and other income sources.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Income
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomePage;

