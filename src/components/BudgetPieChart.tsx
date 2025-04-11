import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Category {
  id: string;
  name: string;
}

interface MonthlyData {
  [categoryId: string]: {
    spent: number;
    budget: number;
  };
}

const CHART_COLORS = {
  spent: 'rgba(239, 68, 68, 0.5)', // red
  remaining: 'rgba(34, 197, 94, 0.5)', // green
  border: {
    spent: 'rgb(239, 68, 68)',
    remaining: 'rgb(34, 197, 94)'
  }
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function BudgetChart({ categories }: { categories: Category[] }) {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetsAndExpenses();
  }, [categories]);

  const fetchBudgetsAndExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current month's date range
      const currentDate = new Date();
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('category_id, amount');

      if (budgetError) throw budgetError;

      // Fetch expenses for current month
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, category_id')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('is_deleted', false);

      if (expenseError) throw expenseError;

      // Process data
      const data: MonthlyData = {};
      
      // Initialize with budgets
      budgetData?.forEach(budget => {
        data[budget.category_id] = {
          budget: budget.amount,
          spent: 0
        };
      });

      // Add expenses
      expenses?.forEach(expense => {
        if (!data[expense.category_id]) {
          data[expense.category_id] = {
            budget: 0,
            spent: 0
          };
        }
        data[expense.category_id].spent += expense.amount;
      });

      setMonthlyData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  const chartData = {
    labels: categories
      .filter(cat => monthlyData[cat.id])
      .map(cat => cat.name),
    datasets: [
      {
        label: 'Spent',
        data: categories
          .filter(cat => monthlyData[cat.id])
          .map(cat => monthlyData[cat.id].spent),
        backgroundColor: CHART_COLORS.spent,
        borderColor: CHART_COLORS.border.spent,
        borderWidth: 1
      },
      {
        label: 'Remaining',
        data: categories
          .filter(cat => monthlyData[cat.id])
          .map(cat => Math.max(0, monthlyData[cat.id].budget - monthlyData[cat.id].spent)),
        backgroundColor: CHART_COLORS.remaining,
        borderColor: CHART_COLORS.border.remaining,
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Monthly Budget Overview
      </h2>

      {/* Numerical breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {categories
          .filter(cat => monthlyData[cat.id])
          .map(category => {
            const data = monthlyData[category.id];
            const remaining = Math.max(0, data.budget - data.spent);
            const percentage = data.budget > 0 
              ? Math.round((data.spent / data.budget) * 100) 
              : 0;

            return (
              <div 
                key={category.id} 
                className={`p-4 rounded-lg border ${
                  percentage >= 100 
                    ? 'border-red-200 bg-red-50' 
                    : percentage >= 80 
                      ? 'border-yellow-200 bg-yellow-50' 
                      : 'border-green-200 bg-green-50'
                }`}
              >
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Budget: {formatINR(data.budget)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Spent: {formatINR(data.spent)}
                  </p>
                  <p className={`text-sm font-medium ${
                    percentage >= 100 
                      ? 'text-red-700' 
                      : percentage >= 80 
                        ? 'text-yellow-700' 
                        : 'text-green-700'
                  }`}>
                    Remaining: {formatINR(remaining)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        percentage >= 100 
                          ? 'bg-red-600' 
                          : percentage >= 80 
                            ? 'bg-yellow-600' 
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bar chart */}
      <div className="h-96">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                  callback: (value) => formatINR(value as number)
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.dataset.label}: ${formatINR(value)}`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}