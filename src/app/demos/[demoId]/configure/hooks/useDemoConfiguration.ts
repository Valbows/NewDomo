/**
 * Demo Configuration Hook
 *
 * Manages demo configuration state and business logic.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/auth';
import { UIState } from '@/lib/tavus';
import { Demo, DemoVideo, KnowledgeChunk, ProcessingStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getErrorMessage, logError } from '@/lib/errors';

export function useDemoConfiguration(demoId: string) {
  // State
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [tavusPersonaId, setTavusPersonaId] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);

  // Fetch demo data
  const fetchDemoData = useCallback(async () => {
    try {
      const { data: demoData, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .single();
      
      if (demoError) throw demoError;
      if (!demoData) throw new Error('Demo not found.');
      
      setDemo(demoData);
      setTavusPersonaId(demoData.tavus_persona_id || null);

      // Fetch videos
      const { data: videoData, error: videoError } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('demo_id', demoId)
        .order('order_index');
      
      if (videoError) {
        console.warn('Could not fetch videos:', videoError.message);
      } else {
        setDemoVideos(videoData || []);
      }

      // Fetch knowledge chunks
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('demo_id', demoId);
      
      if (knowledgeError) {
        console.warn('Could not fetch knowledge chunks:', knowledgeError.message);
      } else {
        setKnowledgeChunks(knowledgeData || []);
      }

    } catch (err: unknown) {
      logError(err, 'Failed to fetch demo data');
      setError(getErrorMessage(err, 'Failed to fetch demo data.'));
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  // Initialize data
  useEffect(() => {
    setLoading(true);
    fetchDemoData();
  }, [fetchDemoData]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase.channel(`demo-${demoId}`);

    channel
      .on('broadcast', { event: 'play_video' }, (payload) => {
        console.log('Received play_video event:', payload);
        // Handle video play events if needed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoId]);

  return {
    // State
    demo,
    loading,
    error,
    demoVideos,
    knowledgeChunks,
    uiState,
    tavusPersonaId,
    conversationData,
    
    // Actions
    setDemo,
    setError,
    setDemoVideos,
    setKnowledgeChunks,
    setUiState,
    setTavusPersonaId,
    setConversationData,
    fetchDemoData,
  };
}