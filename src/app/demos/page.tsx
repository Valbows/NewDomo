'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Demo {
  id: string;
  name: string;
  created_at: string;
}

function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }

        const { data: demosData, error: demosError } = await supabase
          .from('demos')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (demosError) {
          console.error('Error fetching demos:', demosError);
          setError('Error loading demos. Please try again.');
        } else {
          setDemos(demosData || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error loading demos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDemos();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading demos...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  if (demos.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full p-8">
          <h2 className="text-2xl font-semibold mb-4 text-domo-dark-text">No Demos Found</h2>
          <p className="text-domo-light-text mb-6">You haven't created any demos yet. Let's get started!</p>
          <Link href="/demos/create" className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg">
            Create Your First Demo
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-domo-dark-text">Your Demos</h1>
        <Link href="/demos/create" className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg">
          + New Demo
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <div key={demo.id} className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors">
            <h5 className="mb-2 text-xl font-bold tracking-tight text-domo-dark-text">{demo.name}</h5>
            <p className="font-normal text-domo-light-text mb-4">
              Created on: {new Date(demo.created_at).toLocaleDateString()}
            </p>
            <div className="flex space-x-2">
              <Link 
                href={`/demos/${demo.id}/onboarding`}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Setup Guide
              </Link>
              <Link 
                href={`/demos/${demo.id}/configure`}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                Advanced
              </Link>
              <Link 
                href={`/demos/${demo.id}/experience`}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DemosPage);
