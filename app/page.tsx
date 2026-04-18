'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface ChildProgress {
  id: string;
  name: string;
  age: number;
  totalScore: number;
  lastActive: string;
}

export default function Dashboard() {
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildrenProgress();
  }, []);

  const fetchChildrenProgress = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, age')
        .limit(10);

      if (fetchError) throw fetchError;

      // Transform data for display
      const childrenData: ChildProgress[] = (data || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Unnamed',
        age: profile.age || 0,
        totalScore: 0,
        lastActive: 'N/A',
      }));

      setChildren(childrenData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load children');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
        <p className="text-gray-600">
          Monitor your children's therapeutic progress and insights from their games.
        </p>
      </div>

      {/* Children Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading children's data...</p>
          </div>
        ) : error ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        ) : children.length === 0 ? (
          <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">No children found. Start by adding a child in the mobile app!</p>
          </div>
        ) : (
          children.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {child.name}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Age: {child.age} years</p>
                <p>Last Active: {child.lastActive}</p>
                <p className="text-lg font-semibold text-indigo-600 mt-4">
                  Score: {child.totalScore}
                </p>
              </div>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium">
                View Insights
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <p className="text-3xl font-bold text-indigo-600">{children.length}</p>
            <p className="text-sm text-gray-600 mt-2">Children</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">—</p>
            <p className="text-sm text-gray-600 mt-2">This Week</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">—</p>
            <p className="text-sm text-gray-600 mt-2">Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
