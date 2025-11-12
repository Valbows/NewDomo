'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Demo } from './types';
import { Reporting } from './components/Reporting';

export default function DemoConfigurationPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const searchParams = useSearchParams();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'videos');

  const fetchDemoData = useCallback(async () => {
    try {
      const { data: demoData, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();
      if (demoError) throw demoError;
      if (!demoData) throw new Error('Demo not found.');
      setDemo(demoData);
    } catch (err: unknown) {
      console.error('Failed to fetch demo data:', err);
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => {
    fetchDemoData();
  }, [fetchDemoData]);

  const handleTabClick = (tabValue: string) => {
    setActiveTab(tabValue);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabValue);
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Configure: {demoId}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="flex border-b border-gray-200 bg-white">
            <button 
              value="videos" 
              onClick={() => handleTabClick('videos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'videos' 
                  ? 'text-indigo-600 border-indigo-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Videos
            </button>
            <button 
              value="knowledge" 
              onClick={() => handleTabClick('knowledge')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'knowledge' 
                  ? 'text-indigo-600 border-indigo-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Knowledge Base
            </button>
            <button 
              value="agent" 
              onClick={() => handleTabClick('agent')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'agent' 
                  ? 'text-indigo-600 border-indigo-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Agent Settings
            </button>
            <button 
              value="cta" 
              onClick={() => handleTabClick('cta')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cta' 
                  ? 'text-indigo-600 border-indigo-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Call-to-Action
            </button>
            <button 
              value="reporting" 
              onClick={() => handleTabClick('reporting')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reporting' 
                  ? 'text-indigo-600 border-indigo-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Reporting
            </button>
          </div>
          <div className="mt-6">
            {activeTab === 'videos' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Video Management</h2>
                <p>Upload and manage your demo videos here.</p>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Upload Video
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'knowledge' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Knowledge Base Management</h2>
                <p>Manage Q&A pairs and documents for your agent.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Answer</label>
                    <textarea className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows={3}></textarea>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Add Q&A Pair
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'agent' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Agent Settings</h2>
                <p>Configure your agent's personality and objectives.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agent Name</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Personality</label>
                    <textarea className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows={3}></textarea>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'cta' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Call-to-Action Settings</h2>
                <p>Configure your call-to-action messages and buttons.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CTA Title</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CTA Message</label>
                    <textarea className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows={3}></textarea>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Save CTA
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'reporting' && (
              <Reporting demo={demo} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}