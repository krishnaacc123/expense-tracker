import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
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
      setError('Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    setBudgets(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0
    }));
  };

  const handleSaveBudgets = async () => {
    try {
      setSaving(true);
      setError('');

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Delete existing budgets for the current user
      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new budgets
      const budgetsToInsert = Object.entries(budgets)
        .filter(([_, amount]) => amount > 0) // Only insert budgets with positive amounts
        .map(([category_id, amount]) => ({
          category_id,
          amount,
          user_id: user.id
        }));

      if (budgetsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert(budgetsToInsert);

        if (insertError) throw insertError;
      }

      await fetchBudgets();
    } catch (err) {
      console.error('Error saving budgets:', err);
      setError('Failed to save budgets. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && Object.keys(budgets).length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Category Budgets</h2>
        <button
          onClick={handleSaveBudgets}
          disabled={saving}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            saving 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Budgets'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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