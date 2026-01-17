'use client';

import React from 'react';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import DemoList from '@/components/DemoList';
import Link from 'next/link';
import { useDemosRealtime } from '@/hooks/useDemosRealtime';
import DashboardSummary from '@/components/DashboardSummary';

const DashboardPage = () => {
  const { demos, loading, error, refresh } = useDemosRealtime();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-heading">Dashboard</h1>
        <p className="text-domo-text-secondary mt-1">Welcome back! Here's an overview of your demos.</p>
      </div>

      <DashboardSummary demos={demos} loading={loading} />

      <div className="mt-8">
        <Link href="/demos/create">
          <button className="bg-domo-primary hover:bg-domo-secondary text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Demo
          </button>
        </Link>
      </div>

      <DemoList demos={demos} loading={loading} error={error} onRefresh={refresh} />
    </DashboardLayout>
  );
};

export default withAuth(DashboardPage);
