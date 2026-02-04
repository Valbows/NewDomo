'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DemoListItem from './DemoListItem';
import type { Demo } from '@/app/demos/[demoId]/configure/types';
import { useDemosRealtime } from '@/hooks/useDemosRealtime';
import { supabase } from '@/lib/supabase';

interface DemoListProps {
  demos?: Demo[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const DemoList: React.FC<DemoListProps> = ({ demos: demosProp, loading: loadingProp, error: errorProp, onRefresh }) => {
  const hook = useDemosRealtime({ subscribeToAnalyticsUpdated: !Boolean(demosProp) });

  const demos = demosProp ?? hook.demos;
  const loading = loadingProp ?? hook.loading;
  const error = errorProp ?? hook.error;
  const refresh = onRefresh ?? hook.refresh;

  const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteDemo = async (demoId: string) => {
    try {
      setDeleteError(null);
      const { error: deleteErr } = await supabase
        .from('demos')
        .delete()
        .eq('id', demoId);

      if (deleteErr) {
        console.error('Failed to delete demo:', deleteErr);
        setDeleteError('Failed to delete demo. Please try again.');
        return;
      }

      refresh();
    } catch (err) {
      console.error('Error deleting demo:', err);
      setDeleteError('An error occurred while deleting the demo.');
    }
  };

  useEffect(() => {
    const fetchConversationCounts = async () => {
      if (demos.length === 0) return;

      try {
        const demoIds = demos.map((d) => d.id);

        const { data, error: fetchError } = await supabase
          .from("conversation_details")
          .select("demo_id")
          .in("demo_id", demoIds);

        if (fetchError) {
          console.error("Failed to fetch conversation counts:", fetchError);
          return;
        }

        const counts: Record<string, number> = {};
        for (const conv of data || []) {
          counts[conv.demo_id] = (counts[conv.demo_id] || 0) + 1;
        }
        setConversationCounts(counts);
      } catch (err) {
        console.error("Error fetching conversation counts:", err);
      }
    };

    fetchConversationCounts();
  }, [demos]);

  return (
    <div className="mt-8" data-testid="demo-list" aria-busy={loading} aria-live="polite">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white font-heading">Your Demos</h2>
        <Link href="/demos/create">
          <button className="bg-domo-primary hover:bg-domo-secondary text-white font-semibold py-3 sm:py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Demo
          </button>
        </Link>
      </div>

      {(error || deleteError) && (
        <div className="flex items-center justify-between text-sm bg-domo-error/10 border border-domo-error/20 p-4 rounded-xl mb-4">
          <span className="text-domo-error">{error || deleteError}</span>
          <button
            onClick={() => {
              setDeleteError(null);
              refresh();
            }}
            className="ml-3 inline-flex items-center px-4 py-2 rounded-lg bg-domo-error/20 text-domo-error hover:bg-domo-error/30 transition-colors"
            data-testid="demo-list-retry"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !demos.length && (
        <div className="bg-domo-bg-card border border-domo-border rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-domo-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-domo-text-secondary">No demos yet. Create your first demo to get started.</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4" data-testid="demo-list-skeletons">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-domo-bg-card border border-domo-border p-5 rounded-xl animate-pulse" data-testid="demo-skeleton-item">
              <div className="h-5 w-40 bg-domo-bg-elevated rounded" />
              <div className="mt-3 h-4 w-64 bg-domo-bg-elevated rounded" />
              <div className="mt-2 h-4 w-32 bg-domo-bg-elevated rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {demos.map((demo) => (
            <DemoListItem
              key={demo.id}
              demo={demo}
              conversationCount={conversationCounts[demo.id] || 0}
              onDelete={handleDeleteDemo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DemoList;
