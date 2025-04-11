import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  Menu,
  X,
  Plus
} from 'lucide-react';

import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseStats from '../components/ExpenseStats';
import ActivityLog from '../components/ActivityLog';
import CategoryManager from '../components/CategoryManager';
import BudgetManager from '../components/BudgetManager';
import BudgetPieChart from '../components/BudgetPieChart';

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${user.id}`)
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
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

  const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `${isActive 
          ? 'border-indigo-500 text-gray-900 bg-indigo-50'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
        } flex items-center px-3 py-2 text-sm font-medium border-l-4`
      }
    >
      <Icon className="h-5 w-5 mr-3" />
      {children}
    </NavLink>
  );

  // Hide FAB on the add expense page
  const shouldShowFAB = location.pathname !== '/dashboard/add';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">ExpenseTracker</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavItem to="/dashboard" icon={List}>Expenses</NavItem>
                <NavItem to="/dashboard/stats" icon={PieChart}>Statistics</NavItem>
                <NavItem to="/dashboard/activity" icon={History}>Activity</NavItem>
                <NavItem to="/dashboard/settings" icon={Settings}>Settings</NavItem>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div className={`fixed inset-0 flex z-40 sm:hidden ${isMobileMenuOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              <NavItem to="/dashboard" icon={List}>Expenses</NavItem>
              <NavItem to="/dashboard/stats" icon={PieChart}>Statistics</NavItem>
              <NavItem to="/dashboard/activity" icon={History}>Activity</NavItem>
              <NavItem to="/dashboard/settings" icon={Settings}>Settings</NavItem>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <BudgetPieChart categories={categories} />
              <ExpenseList categories={categories} />
            </div>
          } />
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

      {/* Floating Action Button */}
      {shouldShowFAB && (
        <button
          onClick={() => navigate('/dashboard/add')}
          className="fixed right-4 bottom-4 sm:right-8 sm:bottom-8 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}