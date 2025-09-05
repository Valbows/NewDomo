'use client';

import React, { useEffect } from 'react';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import DemoList from '@/components/DemoList';
import Link from 'next/link';
import { useDemosRealtime } from '@/hooks/useDemosRealtime';
import DashboardSummary from '@/components/DashboardSummary';
import { debugAuth } from '@/lib/debug';

const DashboardPage = () => {
  const { demos, loading, error, refresh } = useDemosRealtime();

  useEffect(() => {
    debugAuth('DashboardPage mount', { demosCount: demos?.length ?? 0, loading });
  }, []);

  return (
    <DashboardLayout>
      <h1 data-testid="dashboard-heading" className="text-3xl font-bold text-domo-dark-text">Dashboard</h1>
      <p className="text-domo-light-text">Welcome back, User!</p>

      <DashboardSummary demos={demos} loading={loading} />

      <div className="mt-8">
        <Link href="/demos/create">
          <button className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg">
            + Create New Demo
          </button>
        </Link>
      </div>

      <DemoList demos={demos} loading={loading} error={error} onRefresh={refresh} />
    </DashboardLayout>
  );
};

export default withAuth(DashboardPage);
