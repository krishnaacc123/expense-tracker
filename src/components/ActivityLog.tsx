import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { PlusCircle, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
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

    if (!error && data) {
      setActivities(data);
    }
  };

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
              <div className="flex items-center space-x-3">
                {activity.action === 'add' ? (
                  <PlusCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action === 'add' ? 'Added' : 'Deleted'}{' '}
                    {activity.expense.description || activity.expense.category.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatINR(activity.expense.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}