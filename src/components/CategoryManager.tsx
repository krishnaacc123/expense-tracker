import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Save, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
  user_id: string | null;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesUpdate: () => void;
}

export default function CategoryManager({ categories, onCategoriesUpdate }: CategoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryIcon.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim(),
            icon: newCategoryIcon.trim(),
            is_default: false,
            user_id: user.id
          }
        ]);

      if (error) throw error;

      setNewCategoryName('');
      setNewCategoryIcon('');
      setIsAdding(false);
      onCategoriesUpdate();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim() || !editIcon.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error } = await supabase
        .from('categories')
        .update({
          name: editName.trim(),
          icon: editIcon.trim()
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      onCategoriesUpdate();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setError('');
  };

  const isEditable = async (category: Category) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !category.is_default && category.user_id === user?.id;
    } catch (err) {
      console.error('Error checking category editability:', err);
      return false;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Categories</h2>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setError('');
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Icon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter icon name"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
                setNewCategoryIcon('');
                setError('');
              }}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              disabled={saving}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`flex items-center justify-between p-4 rounded-lg ${
              editingId === category.id ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
            } transition-colors`}
          >
            {editingId === category.id ? (
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Icon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter icon name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateCategory(category.id)}
                    disabled={saving}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <span className="text-indigo-600">{category.icon}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    {category.is_default && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                {!category.is_default && category.user_id && (
                  <button
                    onClick={() => startEditing(category)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}