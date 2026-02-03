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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">Dashboard</h1>
        <p className="text-sm sm:text-base text-domo-text-secondary mt-1">Welcome back! Here's an overview of your demos.</p>
      </div>

      <DashboardSummary demos={demos} loading={loading} />

      <DemoList demos={demos} loading={loading} error={error} onRefresh={refresh} />
    </DashboardLayout>
  );
};

export default withAuth(DashboardPage);
