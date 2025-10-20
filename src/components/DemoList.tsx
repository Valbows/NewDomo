 'use client';
import React from 'react';
import Link from 'next/link';
import DemoListItem from './DemoListItem';
import type { Demo } from '@/app/demos/[demoId]/configure/types';
import { useDemosRealtime } from '@/hooks/useDemosRealtime';

interface DemoListProps {
  demos?: Demo[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const DemoList: React.FC<DemoListProps> = ({ demos: demosProp, loading: loadingProp, error: errorProp, onRefresh }) => {
  // Always call the hook (safe with React rules). Disable subscription if parent provides demos.
  const hook = useDemosRealtime({ subscribeToAnalyticsUpdated: !Boolean(demosProp) });

  const demos = demosProp ?? hook.demos;
  const loading = loadingProp ?? hook.loading;
  const error = errorProp ?? hook.error;
  const refresh = onRefresh ?? hook.refresh;

  return (
    <div className="mt-8" data-testid="demo-list" aria-busy={loading} aria-live="polite">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-domo-dark-text">Your Demos</h2>
        <Link href="/demos/create" className="text-sm text-indigo-600 hover:underline">
          Create new
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">
          <span>{error}</span>
          <button
            onClick={refresh}
            className="ml-3 inline-flex items-center px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
            data-testid="demo-list-retry"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !demos.length && (
        <div className="text-sm text-gray-500">No demos yet. Create your first demo to get started.</div>
      )}

      {loading ? (
        <div className="space-y-4" data-testid="demo-list-skeletons">
          {[0,1,2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse" data-testid="demo-skeleton-item">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="mt-2 h-4 w-64 bg-gray-200 rounded" />
              <div className="mt-1 h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {demos.map((demo) => (
            <DemoListItem key={demo.id} demo={demo} />
          ))}
        </div>
      )}

      {/* 'refresh' retained for future pull-to-refresh or retry buttons */}
    </div>
  );
};

export default DemoList;
