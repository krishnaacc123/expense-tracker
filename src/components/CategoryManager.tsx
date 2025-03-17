import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Save, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
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
    if (!newCategoryName.trim() || !newCategoryIcon.trim()) return;

    try {
      setSaving(true);
      setError('');
      
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim(),
            icon: newCategoryIcon.trim(),
            is_default: false
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
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Categories</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
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
                Category Name
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
                Icon
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
              onClick={() => setIsAdding(false)}
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
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <span className="text-indigo-600">{category.icon}</span>
              </div>
              {editingId === category.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
              )}
            </div>
            <div className="flex space-x-2">
              {editingId === category.id ? (
                <>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateCategory(category.id)}
                    disabled={saving}
                    className="p-2 text-indigo-600 hover:text-indigo-700"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                </>
              ) : (
                !category.is_default && (
                  <button
                    onClick={() => startEditing(category)}
                    className="p-2 text-gray-400 hover:text-gray-500"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}