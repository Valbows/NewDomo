'use client';

import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, Settings } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="ml-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Back button row */}
          <div className="mb-2">
            <Link
              href={`/demos/${demoId}/configure`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Configure
            </Link>
          </div>

          {/* Main header row */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{demo?.name}</h1>
              <p className="text-sm text-gray-500">Analytics and conversation insights</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/demos/${demoId}/configure`}
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Link>
              <Link
                href={`/demos/${demoId}/experience`}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
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
