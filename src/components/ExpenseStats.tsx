import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface Category {
  id: string;
  name: string;
}

interface ExpenseStats {
  category_id: string;
  category_name: string;
  total_amount: number;
}

// Helper function to format currency in Indian format
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ExpenseStats({ categories }: { categories: Category[] }) {
  const [timeframe, setTimeframe] = useState('month');
  const [stats, setStats] = useState<ExpenseStats[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    let startDate, endDate;

    if (timeframe === 'month') {
      startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    } else if (timeframe === 'year') {
      startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
      endDate = format(endOfYear(new Date()), 'yyyy-MM-dd');
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        category_id,
        categories (name),
        amount
      `)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      const statsByCategory = data.reduce((acc: Record<string, ExpenseStats>, expense) => {
        const categoryId = expense.category_id;
        const categoryName = expense.categories.name;
        
        if (!acc[categoryId]) {
          acc[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            total_amount: 0
          };
        }
        
        acc[categoryId].total_amount += expense.amount;
        return acc;
      }, {});

      const statsArray = Object.values(statsByCategory);
      const total = statsArray.reduce((sum, stat) => sum + stat.total_amount, 0);
      
      setStats(statsArray);
      setTotalAmount(total);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Expense Statistics</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Total: {formatINR(totalAmount)}
          </h3>
        </div>

        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.category_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{stat.category_name}</p>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${(stat.total_amount / totalAmount) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatINR(stat.total_amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {((stat.total_amount / totalAmount) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}