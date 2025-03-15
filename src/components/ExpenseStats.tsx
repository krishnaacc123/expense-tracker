import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface MonthlyStats {
  month: string;
  total: number;
  categories: {
    [key: string]: {
      name: string;
      amount: number;
    };
  };
}

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ExpenseStats({ categories }: { categories: Category[] }) {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async () => {
    // Fetch last 12 months of data
    const endDate = new Date();
    const startDate = subMonths(endDate, 11);

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount,
        date,
        category_id,
        categories (name)
      `)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (!error && data) {
      const monthlyData: Record<string, MonthlyStats> = {};

      data.forEach(expense => {
        const monthKey = format(parseISO(expense.date), 'yyyy-MM');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            total: 0,
            categories: {}
          };
        }

        monthlyData[monthKey].total += expense.amount;

        if (!monthlyData[monthKey].categories[expense.category_id]) {
          monthlyData[monthKey].categories[expense.category_id] = {
            name: expense.categories.name,
            amount: 0
          };
        }

        monthlyData[monthKey].categories[expense.category_id].amount += expense.amount;
      });

      setMonthlyStats(Object.values(monthlyData));
    }
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Monthly Statistics</h2>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {monthlyStats.map((stat) => (
            <div key={stat.month} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleMonth(stat.month)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  {expandedMonths.includes(stat.month) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="ml-2 font-medium">
                    {format(parseISO(stat.month + '-01'), 'MMMM yyyy')}
                  </span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatINR(stat.total)}
                </span>
              </button>

              {expandedMonths.includes(stat.month) && (
                <div className="border-t border-gray-200">
                  {Object.entries(stat.categories).map(([categoryId, data]) => (
                    <div
                      key={categoryId}
                      className="flex justify-between items-center p-4 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-600">{data.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatINR(data.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}