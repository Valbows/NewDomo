'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User authentication failed. Please sign in again.');
      }

      // Check for duplicate demo name for this user
      const { data: existingDemo, error: checkError } = await supabase
        .from('demos')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', demoName.trim())
        .maybeSingle();

      if (checkError) {
        throw new Error('Failed to check for existing demos. Please try again.');
      }

      if (existingDemo) {
        setError('A demo with this name already exists. Please choose a different name.');
        setLoading(false);
        return;
      }

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
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Create a New Demo</h1>
        <p className="text-domo-text-secondary mb-8">Give your demo a name to get started. You'll upload videos and configure your agent in the next step.</p>

        <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-domo-bg-card border border-domo-border rounded-xl">
          <div>
            <label htmlFor="demoName" className="block text-sm font-medium text-domo-text-secondary">
              Demo Name
            </label>
            <input
              type="text"
              id="demoName"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary"
              placeholder="e.g., Q2 Product Launch Demo"
              required
            />
          </div>

          {error && <p className="text-sm text-domo-error">{error}</p>}

          <div className="text-right">
            <button
              type="submit"
              className="inline-flex justify-center py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-domo-primary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
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
