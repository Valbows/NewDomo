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
          <div className="text-lg text-domo-text-secondary">Loading demos...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-domo-error">{error}</div>
      </DashboardLayout>
    );
  }

  if (demos.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full p-8">
          <h2 className="text-2xl font-semibold mb-4 text-white font-heading">No Demos Found</h2>
          <p className="text-domo-text-secondary mb-6">You haven't created any demos yet. Let's get started!</p>
          <Link href="/demos/create" className="bg-domo-primary hover:bg-domo-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Create Your First Demo
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white font-heading">Your Demos</h1>
        <Link href="/demos/create" className="bg-domo-primary hover:bg-domo-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors">
          + New Demo
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Link href={`/demos/${demo.id}/configure`} key={demo.id}>
            <div className="block p-6 bg-domo-bg-card border border-domo-border rounded-xl shadow hover:bg-domo-bg-elevated transition-colors">
              <h5 className="mb-2 text-xl font-bold tracking-tight text-white">{demo.name}</h5>
              <p className="font-normal text-domo-text-secondary">
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
