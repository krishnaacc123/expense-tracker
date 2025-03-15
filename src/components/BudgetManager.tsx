import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth } from 'date-fns';
import { Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Budget {
  category_id: string;
  amount: number;
}

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function BudgetManager({ categories }: { categories: Category[] }) {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetchBudgets();
  }, [month]);

  const fetchBudgets = async () => {
    const startDate = format(startOfMonth(new Date(month)), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('category_budgets')
      .select('category_id, amount')
      .eq('month', startDate);

    if (!error && data) {
      const budgetMap = data.reduce((acc: Record<string, number>, budget) => {
        acc[budget.category_id] = budget.amount;
        return acc;
      }, {});
      setBudgets(budgetMap);
    }
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    setBudgets(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0
    }));
  };

  const handleSaveBudgets = async () => {
    const startDate = format(startOfMonth(new Date(month)), 'yyyy-MM-dd');
    
    // Delete existing budgets for the month
    await supabase
      .from('category_budgets')
      .delete()
      .eq('month', startDate);

    // Insert new budgets
    const budgetsToInsert = Object.entries(budgets).map(([category_id, amount]) => ({
      category_id,
      amount,
      month: startDate
    }));

    const { error } = await supabase
      .from('category_budgets')
      .insert(budgetsToInsert);

    if (!error) {
      fetchBudgets();
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Monthly Budgets</h2>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={handleSaveBudgets}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Budgets
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <span className="text-indigo-600">{category.icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{category.name}</span>
            </div>
            <div className="w-48">
              <input
                type="number"
                min="0"
                step="100"
                value={budgets[category.id] || ''}
                onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Set budget..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}