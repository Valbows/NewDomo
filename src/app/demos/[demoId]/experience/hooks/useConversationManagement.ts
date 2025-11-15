import {useState, useEffect} from 'react';
import {supabase} from '@/lib/utils/supabase/browser';

import {getErrorMessage, logError} from '@/lib/errors';
import { Demo } from '@/app/demos/[demoId]/configure/types';

// Validate that a URL points to a Daily room (required by our CVI join logic)
const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

interface UseConversationManagementProps {
  demoId: string;
  forceNew?: boolean;
}

export function useConversationManagement({ demoId, forceNew = false }: UseConversationManagementProps) {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Fetch demo data and start conversation
  useEffect(() => {
    const fetchDemoAndStartConversation = async () => {
      try {
        // E2E mode: provide stub data, avoid network calls
        if (isE2E) {
          const stubDemo: Demo = {
            id: demoId,
            name: 'E2E Demo',
            user_id: 'e2e-user',
            tavus_conversation_id: 'e2e-conv',
            metadata: {
              tavusShareableLink: 'about:blank',
              ctaTitle: 'Ready to Get Started?',
              ctaMessage: 'Take the next step today!',
              ctaButtonText: 'Start Free Trial',
              ctaButtonUrl: 'https://example.com/meta-start'
            },
            // Admin-level CTA fields (override metadata for testing precedence)
            cta_title: 'Ready to Get Started?',
            cta_message: 'Take the next step today!',
            cta_button_text: 'Start Free Trial',
            cta_button_url: 'https://example.com/admin-start'
          };
          setDemo(stubDemo);
          setConversationUrl('about:blank');
          setLoading(false);
          return;
        }

        // Get demo data
        const { data: demoData, error: demoError } = await supabase
          .from('demos')
          .select('*')
          .eq('id', demoId)
          .single();

        if (demoError || !demoData) {
          setError('Demo not found');
          setLoading(false);
          return;
        }

        // Parse metadata if it's a string BEFORE setting demo state
        let processedDemoData = { ...demoData };
        
        if (typeof processedDemoData.metadata === 'string') {

          try {
            processedDemoData.metadata = JSON.parse(processedDemoData.metadata);

          } catch (e: unknown) {
            logError(e, '❌ Failed to parse metadata');
            processedDemoData.metadata = {};
          }
        }
        
        // Set the demo with properly parsed metadata
        setDemo(processedDemoData);
        
        // Debug: Log full demo data
        // console.log('📊 Full Demo Data:', JSON.stringify(processedDemoData, null, 2));

        // console.log('📦 Demo Metadata Value:', JSON.stringify(processedDemoData.metadata, null, 2));

        // Always obtain a fresh/validated Daily conversation URL from the server
        // Server will reuse valid existing rooms or create a new one if stale
        // console.log('🚀 Requesting Daily conversation URL from API (ignoring saved metadata)');
        try {
          // In-flight client-side dedupe (helps with React Strict Mode double-invoke in dev)
          const win: any = typeof window !== 'undefined' ? window : undefined;
          if (win) {
            win.__startConvInflight = win.__startConvInflight || new Map<string, Promise<any>>();
          }
          const inflight: Map<string, Promise<any>> | undefined = win?.__startConvInflight;
          let startPromise = inflight?.get(processedDemoData.id);
          if (!startPromise) {
            startPromise = fetch('/api/start-conversation', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ demoId: processedDemoData.id, forceNew }),
            }).then(async (resp) => {
              if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw err;
              }
              return resp.json();
            });
            inflight?.set(processedDemoData.id, startPromise);
          } else {
            // console.log('⏳ Waiting for in-flight conversation start (deduped)');
          }
          let data: any;
          try {
            data = await startPromise;
          } finally {
            inflight?.delete(processedDemoData.id);
          }
          const url = data?.conversation_url as string | undefined;
          if (url && isDailyRoomUrl(url)) {

            setConversationUrl(url);
          } else {
            // console.warn('Received non-Daily conversation URL from API:', url);
            setError('Conversation URL invalid. Please verify Domo configuration.');
            setLoading(false);
            return;
          }
        } catch (e) {
          logError(e, 'Error starting conversation');
          setError(getErrorMessage(e, 'Failed to start conversation'));
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        logError(err, 'Error fetching demo');
        setError(getErrorMessage(err, 'Failed to load demo'));
      } finally {
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId, forceNew]);

  // Handle browser window close/refresh to end conversation
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (demo?.tavus_conversation_id) {
        // Use sendBeacon for reliable delivery during page unload
        const endPayload = JSON.stringify({
          conversationId: demo.tavus_conversation_id,
          demoId: demo.id,
        });
        
        try {
          navigator.sendBeacon('/api/end-conversation', endPayload);

        } catch (error) {
          // console.warn('Failed to send conversation end beacon:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [demo?.tavus_conversation_id, demo?.id]);

  const handleConversationEnd = async () => {

    // End the Tavus conversation via API if we have a conversation ID
    if (demo?.tavus_conversation_id) {
      try {

        const response = await fetch('/api/end-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: demo.tavus_conversation_id,
            demoId: demo.id,
          }),
        });

        if (response.ok) {


          // Automatically sync conversation data after ending
          try {

            const syncResponse = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
              method: 'GET',
            });
            
            if (syncResponse.ok) {


            } else {
              // console.warn('⚠️ Failed to sync conversation data, but continuing...');
            }
          } catch (syncError) {
            // console.warn('⚠️ Error syncing conversation data:', syncError);
            // Don't block the flow for sync errors
          }
          
          // Small delay to ensure sync completes before redirect
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          const error = await response.json().catch(() => ({}));
          console.warn('⚠️ Failed to end Tavus conversation:', {
            status: response.status,
            error: error,
            sentData: {
              conversationId: demo.tavus_conversation_id,
              demoId: demo.id
            }
          });
          // Don't block the UI flow for this error
        }
      } catch (error) {
        // console.warn('⚠️ Error ending Tavus conversation:', error);
        // Don't block the UI flow for this error
      }
    }
  };

  return {
    demo,
    loading,
    error,
    conversationUrl,
    handleConversationEnd
  };
}