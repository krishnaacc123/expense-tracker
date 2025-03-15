import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  PlusCircle,
  LogOut,
  Calendar,
  PieChart,
  List,
  Filter,
  History,
  Settings
} from 'lucide-react';

import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseStats from '../components/ExpenseStats';
import ActivityLog from '../components/ActivityLog';
import CategoryManager from '../components/CategoryManager';
import BudgetManager from '../components/BudgetManager';

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">ExpenseTracker</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/dashboard"
                  end
                  className={({ isActive }) =>
                    `${isActive 
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  <List className="h-4 w-4 mr-2" />
                  Expenses
                </NavLink>
                <NavLink
                  to="/dashboard/stats"
                  className={({ isActive }) =>
                    `${isActive
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Statistics
                </NavLink>
                <NavLink
                  to="/dashboard/activity"
                  className={({ isActive }) =>
                    `${isActive
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  <History className="h-4 w-4 mr-2" />
                  Activity
                </NavLink>
                <NavLink
                  to="/dashboard/settings"
                  className={({ isActive }) =>
                    `${isActive
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`
                  }
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <NavLink
                to="/dashboard/add"
                className={({ isActive }) =>
                  `ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                    isActive
                      ? 'text-white bg-indigo-700'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700'
                  }`
                }
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </NavLink>
              <button
                onClick={handleSignOut}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ExpenseList categories={categories} />} />
          <Route path="/add" element={<ExpenseForm categories={categories} />} />
          <Route path="/stats" element={<ExpenseStats categories={categories} />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/settings" element={
            <div className="space-y-6">
              <CategoryManager 
                categories={categories} 
                onCategoriesUpdate={fetchCategories} 
              />
              <BudgetManager categories={categories} />
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}