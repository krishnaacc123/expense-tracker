import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Filter, Calendar, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
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

interface Budget {
  category_id: string;
  amount: number;
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
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, [startDate, endDate, selectedCategory, currentPage]);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('category_id, amount');

      if (error) throw error;

      if (data) {
        const budgetMap = data.reduce((acc: Record<string, number>, budget) => {
          acc[budget.category_id] = budget.amount;
          return acc;
        }, {});
        setBudgets(budgetMap);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to fetch budgets');
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

        // Calculate category totals for the current month
        const { data: allMonthExpenses, error: monthError } = await supabase
          .from('expenses')
          .select('amount, category_id')
          .gte('date', format(new Date().setDate(1), 'yyyy-MM-dd'))
          .lte('date', format(new Date(), 'yyyy-MM-dd'))
          .eq('is_deleted', false);

        if (monthError) throw monthError;

        if (allMonthExpenses) {
          const totals = allMonthExpenses.reduce((acc: Record<string, number>, expense) => {
            acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount;
            return acc;
          }, {});
          setCategoryTotals(totals);
        }
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      setDeleting(expense.id);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

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
          },
          user_id: user.id
        });

      if (logError) throw logError;

      setExpenses(prevExpenses =>
        prevExpenses.map(e =>
          e.id === expense.id ? { ...e, is_deleted: true } : e
        )
      );

      setCategoryTotals(prev => ({
        ...prev,
        [expense.category_id]: (prev[expense.category_id] || 0) - expense.amount
      }));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  const isOverBudget = (categoryId: string) => {
    const budget = budgets[categoryId];
    const total = categoryTotals[categoryId] || 0;
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

  const getEmptyStateMessage = () => {
    if (selectedCategory === 'all') {
      return 'No expenses found for the selected date range';
    }
    const category = categories.find(c => c.id === selectedCategory);
    return `No expenses found in ${category?.name || 'this category'} for the selected date range`;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Expenses</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
          
          {showFilters && (
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
          )}
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">{getEmptyStateMessage()}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  expense.is_deleted 
                    ? 'bg-gray-100 opacity-50'
                    : isOverBudget(expense.category_id)
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
                    {isOverBudget(expense.category_id) && (
                      <p className="text-xs text-red-600 mt-1">
                        Budget exceeded: {formatINR(categoryTotals[expense.category_id])} / {formatINR(budgets[expense.category_id])}
                      </p>
                    )}
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
                      className={`p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 ${
                        deleting === expense.id ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title="Delete expense"
                    >
                      {deleting === expense.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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