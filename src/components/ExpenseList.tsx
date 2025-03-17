import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth } from 'date-fns';
import { Filter, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  is_deleted: boolean;
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

const ITEMS_PER_PAGE = 10;

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ExpenseList({ categories }: { categories: Category[] }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, selectedCategory, currentPage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
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

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      if (data) {
        setExpenses(data);
        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }

        const totals = data.reduce((acc: Record<string, number>, expense) => {
          if (!expense.is_deleted) {
            acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount;
          }
          return acc;
        }, {});
        setCategoryTotals(totals);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      setDeleting(expense.id);
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', expense.id);

      if (updateError) throw updateError;

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

      setExpenses(prevExpenses =>
        prevExpenses.map(e =>
          e.id === expense.id ? { ...e, is_deleted: true } : e
        )
      );
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setDeleting(null);
    }
  };

  const isOverBudget = (expense: Expense) => {
    const budget = budgets[expense.category_id];
    const total = categoryTotals[expense.category_id] || 0;
    return budget && total > budget;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Expenses</h2>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
      </div>

      <div className="p-6">
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
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <span className="text-indigo-600">{expense.category.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formatINR(expense.amount)}</p>
                  <p className="text-sm text-gray-500">{expense.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{expense.category.name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(expense.date), 'MMM d, yyyy')}</p>
                </div>
                {!expense.is_deleted && (
                  <button
                    onClick={() => handleDelete(expense)}
                    disabled={deleting === expense.id}
                    className={`p-1 text-gray-400 hover:text-red-500 transition-colors ${
                      deleting === expense.id ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    title="Delete expense"
                  >
                    {deleting === expense.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}