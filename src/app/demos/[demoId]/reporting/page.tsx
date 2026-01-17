'use client';

import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, Settings, AlertTriangle } from 'lucide-react';
import { Reporting } from '../configure/components/reporting';
import { useDemoData } from '../configure/hooks/useDemoData';

export default function ReportingPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;

  const {
    demo,
    loading,
    error,
  } = useDemoData(demoId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-domo-bg-dark">
        <Loader2 className="w-12 h-12 animate-spin text-domo-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-domo-bg-dark">
        <AlertCircle className="w-12 h-12 text-domo-error" />
        <p className="ml-4 text-white">{error}</p>
      </div>
    );
  }

  // Check if demo setup is complete (has an active agent)
  const isSetupComplete = Boolean(demo?.tavus_persona_id);

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="max-w-md text-center p-8 bg-domo-bg-card border border-domo-border rounded-xl">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 font-heading">Setup Not Complete</h2>
          <p className="text-domo-text-secondary mb-6">
            You need to complete the demo setup before viewing analytics.
            Please finish configuring your demo agent first.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-domo-text-secondary bg-domo-bg-elevated border border-domo-border font-medium rounded-lg hover:bg-domo-bg-elevated/80 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href={`/demos/${demoId}/configure`}
              className="px-4 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary transition-colors"
            >
              Complete Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-domo-bg-dark">
      <header className="bg-domo-bg-card border-b border-domo-border">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Back button row */}
          <div className="mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-domo-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Main header row */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">{demo?.name}</h1>
              <p className="text-sm text-domo-text-secondary">Analytics and conversation insights</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/demos/${demoId}/configure`}
                className="inline-flex items-center px-4 py-2 text-domo-text-secondary bg-domo-bg-elevated border border-domo-border font-medium rounded-lg hover:bg-domo-bg-elevated/80 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Link>
              <Link
                href={`/demos/${demoId}/experience`}
                className="px-4 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary transition-colors"
              >
                View Demo Experience
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Reporting demo={demo} />
      </main>
    </div>
  );
}
