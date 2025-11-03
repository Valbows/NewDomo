'use client';

import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-domo-light-gray">
      <Sidebar />
      <main className="flex-1 p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
