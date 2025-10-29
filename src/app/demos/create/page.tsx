'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/auth';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from 'lucide-react';

// File validator for video uploads
const CreateDemoPage = () => {
  const router = useRouter();
  const [demoName, setDemoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!demoName.trim()) {
      setError('Demo name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.session) {
        throw new Error('User authentication failed. Please sign in again.');
      }
      const user = sessionResult.session.user;

      // Create required metadata to satisfy database validation
      const metadata = {
        uploadId: uuidv4(),
        userId: user.id,
        fileName: `${demoName.replace(/[^a-zA-Z0-9]/g, '_')}_demo`,
        fileType: 'demo_configuration',
        fileSize: 0, // Demo configuration has no file size
        uploadTimestamp: new Date().toISOString(),
        demoName: demoName
      };

      const { data: newDemo, error: insertError } = await supabase
        .from('demos')
        .insert({ 
          name: demoName, 
          user_id: user.id,
          upload_id: metadata.uploadId,
          video_storage_path: '', // Placeholder - will be updated when videos are uploaded
          metadata: metadata
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newDemo) throw new Error('Failed to create demo. Please try again.');

      router.push(`/demos/${newDemo.id}/configure`);

    } catch (err: any) {
      console.error('Error creating demo:', err);
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-domo-dark-text mb-2">Create a New Demo</h1>
        <p className="text-domo-light-text mb-8">Give your demo a name to get started. You'll upload videos and configure your agent in the next step.</p>

        <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-lg shadow-md">
          <div>
            <label htmlFor="demoName" className="block text-sm font-medium text-domo-dark-text">
              Demo Name
            </label>
            <input
              type="text"
              id="demoName"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-domo-blue-accent focus:border-domo-blue-accent"
              placeholder="e.g., Q2 Product Launch Demo"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="text-right">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-domo-green hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-domo-green disabled:bg-gray-400"
              disabled={loading || !demoName}
            >
              {loading ? 'Creating...' : 'Create and Configure'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default withAuth(CreateDemoPage);
