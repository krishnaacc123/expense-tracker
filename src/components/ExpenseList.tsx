import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Filter, Calendar } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  category: Category;
}

// Helper function to format currency in Indian format
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ExpenseList({ categories }: { categories: Category[] }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, selectedCategory]);

  const fetchExpenses = async () => {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, error } = await query;

    if (!error && data) {
      setExpenses(data);
    }
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Total: {formatINR(totalAmount)}
          </h3>
        </div>

        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <span className="text-indigo-600">{expense.category.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-500">{expense.category.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatINR(expense.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(expense.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}