'use client';

/**
 * Public Reporting Page for Demo Viewers
 *
 * Shows the reporting/analytics view to potential customers
 * so they can see what insights Domo provides.
 *
 * Route: /view/[demoId]/reporting
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, BarChart3, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Reporting } from '@/app/demos/[demoId]/configure/components/reporting';
import type { Demo } from '@/app/demos/[demoId]/configure/types';

// Only allow this specific demo ID for public reporting (Workday demo)
const ALLOWED_DEMO_ID = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de';

interface DemoData extends Demo {
  is_embeddable: boolean;
  cta_button_url: string | null;
}

export default function PublicReportingPage() {
  const params = useParams();
  const demoId = params.demoId as string;

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch demo data (restricted to allowed demo only)
  useEffect(() => {
    async function fetchDemo() {
      try {
        setLoading(true);

        // Check if this demo ID is allowed for public viewing
        if (demoId !== ALLOWED_DEMO_ID) {
          setError('Demo not found');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('demos')
          .select('id, name, user_id, created_at, tavus_persona_id, tavus_conversation_id, is_embeddable, cta_button_url, metadata')
          .eq('id', demoId)
          .single();

        if (fetchError || !data) {
          setError('Demo not found');
          return;
        }

        setDemo(data);
      } catch (err) {
        setError('Failed to load demo');
        console.error('Error fetching demo:', err);
      } finally {
        setLoading(false);
      }
    }

    if (demoId) {
      fetchDemo();
    }
  }, [demoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-domo-primary mx-auto mb-4" />
          <p className="text-domo-text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !demo) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-domo-text-primary mb-2">Unable to Load Analytics</h2>
          <p className="text-domo-text-secondary mb-6">{error || 'Demo not found'}</p>
          <a
            href="/"
            className="px-6 py-2 bg-domo-primary text-white rounded-lg hover:bg-domo-primary/90 transition-colors inline-block"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-domo-bg-dark">
      {/* Header */}
      <header className="bg-domo-bg-card border-b border-domo-border">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Preview Banner */}
          <div className="mb-4 p-3 bg-domo-primary/10 border border-domo-primary/30 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-domo-primary" />
                <span className="text-domo-primary font-medium">
                  This is a preview of Domo&apos;s reporting dashboard
                </span>
              </div>
              <a
                href={demo.cta_button_url || 'https://domo.ai'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary transition-colors text-sm"
              >
                Get Started with Domo
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Main header row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">{demo.name}</h1>
              <p className="text-sm text-domo-text-secondary">
                Analytics and conversation insights
              </p>
            </div>
            <a
              href={`/view/${demoId}`}
              className="px-4 py-2 bg-domo-bg-elevated border border-domo-border text-domo-text-secondary font-medium rounded-lg hover:text-white hover:border-domo-primary transition-colors text-center"
            >
              Try Demo Again
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Reporting demo={demo} />

        {/* CTA Footer */}
        <div className="mt-12 p-8 bg-gradient-to-r from-domo-primary/20 to-domo-secondary/20 border border-domo-primary/30 rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-white mb-3 font-heading">
            Ready to create your own AI-powered demos?
          </h3>
          <p className="text-domo-text-secondary mb-6 max-w-2xl mx-auto">
            Get detailed analytics, lead qualification, and conversion tracking for every demo conversation.
            Start converting more visitors into customers with Domo.
          </p>
          <a
            href={demo.cta_button_url || 'https://domo.ai'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-domo-primary text-white font-semibold rounded-xl hover:bg-domo-secondary transition-colors text-lg"
          >
            Start Your Free Trial
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </main>
    </div>
  );
}
