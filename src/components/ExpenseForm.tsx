import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
}

export default function ExpenseForm({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId || !date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      // First, insert the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([
          {
            amount: parseFloat(amount),
            description,
            category_id: categoryId,
            date
          }
        ])
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Then, create an activity log entry
      const selectedCategory = categories.find(c => c.id === categoryId);
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          action: 'add',
          entity_type: 'expense',
          entity_id: expense.id,
          details: {
            amount: parseFloat(amount),
            description,
            category: selectedCategory?.name
          },
          user_id: user.id
        });

      if (logError) throw logError;

      navigate('/dashboard');
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Add New Expense</h2>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter description"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}