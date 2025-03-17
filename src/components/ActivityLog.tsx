import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { PlusCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ActivityLogEntry {
  id: string;
  expense_id: string;
  action: 'add' | 'delete';
  timestamp: string;
  expense: {
    amount: number;
    description: string;
    category: {
      name: string;
    };
  };
}

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          expense:expenses(
            amount,
            description,
            category:categories(name)
          )
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      if (data) {
        setActivities(data);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Activity Log</h2>
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {activity.action === 'add' ? (
                  <PlusCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Trash2 className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action === 'add' ? 'Added' : 'Deleted'} expense: {formatINR(activity.expense.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.expense.description || 'No description'} ({activity.expense.category.name})
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}