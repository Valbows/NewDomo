'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { withAuth } from '@/components/features/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/auth';
import { Demo } from '@/app/demos/[demoId]/configure/types';

function DemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const sessionResult = await authService.getCurrentSession();
        if (!sessionResult.success || !sessionResult.session) {
          window.location.href = '/login';
          return;
        }
        const user = sessionResult.session.user;

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
          <Link href={`/demos/${demo.id}/configure`} key={demo.id}>
            <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors">
              <h5 className="mb-2 text-xl font-bold tracking-tight text-domo-dark-text">{demo.name}</h5>
              <p className="font-normal text-domo-light-text">
                Created on: {new Date(demo.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DemosPage);
