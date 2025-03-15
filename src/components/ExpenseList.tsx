import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth } from 'date-fns';
import { Filter, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  is_deleted?: boolean;
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

const ITEMS_PER_PAGE = 10;

export default function ExpenseList({ categories }: { categories: Category[] }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, [startDate, endDate, selectedCategory, currentPage]);

  const fetchBudgets = async () => {
    const currentMonth = format(new Date(startDate), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('category_budgets')
      .select('category_id, amount')
      .eq('month', currentMonth);

    if (!error && data) {
      const budgetMap = data.reduce((acc: Record<string, number>, budget) => {
        acc[budget.category_id] = budget.amount;
        return acc;
      }, {});
      setBudgets(budgetMap);
    }
  };

  const fetchExpenses = async () => {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    // Add pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (!error && data) {
      setExpenses(data);
      if (count) {
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }

      // Calculate category totals
      const totals = data.reduce((acc: Record<string, number>, expense) => {
        if (!expense.is_deleted) {
          acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount;
        }
        return acc;
      }, {});
      setCategoryTotals(totals);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      // Soft delete the expense
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', expense.id);

      if (updateError) throw updateError;

      // Log the activity
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          action: 'delete',
          entity_type: 'expense',
          entity_id: expense.id,
          details: {
            amount: expense.amount,
            description: expense.description,
            category: expense.category.name
          }
        });

      if (logError) throw logError;

      // Update UI
      setExpenses(prevExpenses =>
        prevExpenses.map(e =>
          e.id === expense.id ? { ...e, is_deleted: true } : e
        )
      );
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const isOverBudget = (expense: Expense) => {
    const budget = budgets[expense.category_id];
    const total = categoryTotals[expense.category_id] || 0;
    return budget && total > budget;
  };

  const totalAmount = expenses
    .filter(expense => !expense.is_deleted)
    .reduce((sum, expense) => sum + expense.amount, 0);

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
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                expense.is_deleted 
                  ? 'bg-gray-100 opacity-50'
                  : isOverBudget(expense)
                    ? 'bg-red-50'
                    : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <span className="text-indigo-600">{expense.category.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{expense.description || 'No description'}</p>
                  <p className="text-xs text-gray-500">{expense.category.name}</p>
                  {isOverBudget(expense) && (
                    <p className="text-xs text-red-600">
                      Budget exceeded: {formatINR(budgets[expense.category_id])}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className={`font-medium ${
                    isOverBudget(expense) ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatINR(expense.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </p>
                </div>
                {!expense.is_deleted && (
                  <button
                    onClick={() => handleDelete(expense)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}