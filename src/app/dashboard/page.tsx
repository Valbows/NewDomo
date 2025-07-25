'use client';

import React from 'react';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import DemoList from '@/components/DemoList';
import Link from 'next/link';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-domo-dark-text">Dashboard</h1>
      <p className="text-domo-light-text">Welcome back, User!</p>

      <div className="mt-8">
        <Link href="/demos/create">
          <button className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg">
            + Create New Demo
          </button>
        </Link>
      </div>

      <DemoList />
    </DashboardLayout>
  );
};

export default withAuth(DashboardPage);
