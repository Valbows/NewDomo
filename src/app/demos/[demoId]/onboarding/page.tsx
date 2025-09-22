'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { Demo, DemoVideo, KnowledgeChunk, ProcessingStatus } from '../configure/types';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, AlertCircle } from 'lucide-react';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { getErrorMessage, logError } from '@/lib/errors';

export default function DemoOnboardingPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ stage: 'idle', progress: 0, message: '' });
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [knowledgeDoc, setKnowledgeDoc] = useState<File | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('Friendly and helpful assistant.');
  const [agentGreeting, setAgentGreeting] = useState('Hello! How can I help you with the demo today?');
  const [objectives, setObjectives] = useState<string[]>(['', '', '']);
  const [tavusPersonaId, setTavusPersonaId] = useState<string | null>(null);
  
  // CTA Settings State
  const [ctaTitle, setCTATitle] = useState('Ready to Get Started?');
  const [ctaMessage, setCTAMessage] = useState('Start your free trial today and see the difference!');
  const [ctaButtonText, setCTAButtonText] = useState('Start Free Trial');

  const fetchDemoData = useCallback(async () => {
    try {
      const { data: demoData, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();
      if (demoError) throw demoError;
      if (!demoData) throw new Error('Demo not found.');
      setDemo(demoData);
      setAgentName(demoData.metadata?.agentName || '');
      setAgentPersonality(demoData.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demoData.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');
      setTavusPersonaId(demoData.tavus_persona_id || null);
      
      // Initialize objectives: ensure 3–5 slots
      const rawObjectives: string[] = Array.isArray(demoData.metadata?.objectives) ? demoData.metadata!.objectives! : [];
      const trimmed = rawObjectives.filter((o) => typeof o === 'string').slice(0, 5);
      const padded = trimmed.length >= 3 ? trimmed : [...trimmed, ...Array(Math.max(0, 3 - trimmed.length)).fill('')];
      setObjectives(padded);
      
      // Initialize CTA settings from demo metadata
      setCTATitle(demoData.metadata?.ctaTitle || 'Ready to Get Started?');
      setCTAMessage(demoData.metadata?.ctaMessage || 'Start your free trial today and see the difference!');
      setCTAButtonText(demoData.metadata?.ctaButtonText || 'Start Free Trial');

      const { data: videoData, error: videoError } = await supabase.from('demo_videos').select('*').eq('demo_id', demoId).order('order_index');
      if (videoError) console.warn('Could not fetch videos:', videoError.message);
      else setDemoVideos(videoData || []);

      const { data: knowledgeData, error: knowledgeError } = await supabase.from('knowledge_chunks').select('*').eq('demo_id', demoId);
      if (knowledgeError) console.warn('Could not fetch knowledge chunks:', knowledgeError.message);
      else setKnowledgeChunks(knowledgeData || []);

    } catch (err: unknown) {
      logError(err, 'Failed to fetch demo data');
      setError(getErrorMessage(err, 'Failed to fetch demo data.'));
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => {
    setLoading(true);
    fetchDemoData();
  }, [fetchDemoData]);

  // Auto-save agent settings
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (demo) {
        const newMetadata = {
          ...demo.metadata,
          agentName,
          agentPersonality,
          agentGreeting,
          objectives: objectives.map((o) => (o || '').trim()).filter(Boolean).slice(0, 5),
        };

        if (JSON.stringify(newMetadata) === JSON.stringify(demo.metadata)) {
          return;
        }

        await supabase
          .from('demos')
          .update({ metadata: newMetadata })
          .eq('id', demoId);
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [agentName, agentPersonality, agentGreeting, objectives, demo, demoId]);

  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle) {
      setError('Please select a video file and provide a title.');
      return;
    }

    setProcessingStatus({ stage: 'uploading', progress: 0, message: 'Uploading video...' });
    setError(null);

    try {
      // Get current user to ensure authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const fileExtension = selectedVideoFile.name.split('.').pop();
      const filePath = `${demoId}/${uuidv4()}.${fileExtension}`;

      console.log('Uploading file:', filePath, 'Size:', selectedVideoFile.size);

      // Upload with explicit options to avoid metadata issues
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('demo-videos')
        .upload(filePath, selectedVideoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);
      setProcessingStatus({ stage: 'processing', progress: 50, message: 'Video uploaded. Adding to database...' });

      const { data: newVideo, error: dbError } = await supabase
        .from('demo_videos')
        .insert({
          demo_id: demoId,
          storage_url: filePath,
          title: videoTitle,
          order_index: demoVideos.length + 1,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      if (!newVideo) throw new Error('Failed to create video record in database.');

      // Start transcription in background
      fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_video_id: newVideo.id }),
      }).catch((err: unknown) => logError(err, 'Transcription request failed'));

      setDemoVideos([...demoVideos, newVideo]);
      setProcessingStatus({ stage: 'completed', progress: 100, message: 'Video uploaded. Transcription in progress.' });
      setSelectedVideoFile(null);
      setVideoTitle('');

    } catch (err: unknown) {
      logError(err, 'Video upload error');
      setError(getErrorMessage(err, 'Failed to upload video.'));
      setProcessingStatus({ stage: 'error', progress: 0, message: 'Upload failed.' });
    }
  };

  const handleAddQAPair = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setError('Please provide both a question and an answer.');
      return;
    }
    setError(null);

    try {
      const { data: newChunk, error } = await supabase
        .from('knowledge_chunks')
        .insert({
          demo_id: demoId,
          content: `Q: ${newQuestion}\nA: ${newAnswer}`,
          chunk_type: 'qa',
        })
        .select()
        .single();

      if (error) throw error;
      if (!newChunk) throw new Error('Failed to add Q&A pair.');

      setKnowledgeChunks([...knowledgeChunks, newChunk]);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to add Q&A pair.'));
    }
  };

  const handleKnowledgeDocUpload = async () => {
    if (!knowledgeDoc) {
      setError('Please select a document to upload.');
      return;
    }
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (!content) {
          setError('File is empty or could not be read.');
          return;
        }

        const { data: newChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
          demo_id: demoId,
          content: content,
          chunk_type: 'document',
          source: knowledgeDoc.name
        }).select().single();

        if (insertError) throw insertError;
        if (!newChunk) throw new Error('Failed to upload document.');
        
        setKnowledgeChunks([...knowledgeChunks, newChunk]);
        setKnowledgeDoc(null);
      };
      reader.readAsText(knowledgeDoc);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to upload document.'));
    }
  };

  const handleSaveCTA = async () => {
    try {
      console.log('💾 Saving CTA data:', {
        ctaTitle,
        ctaMessage,
        ctaButtonText
      });
      
      const { error } = await supabase
        .from('demos')
        .update({
          metadata: {
            ...demo?.metadata,
            ctaTitle,
            ctaMessage,
            ctaButtonText
          }
        })
        .eq('id', demoId);

      if (error) throw error;
      
      console.log('✅ CTA data saved successfully to Supabase');
      
      // Update local demo state
      if (demo) {
        setDemo({
          ...demo,
          metadata: {
            ...demo.metadata,
            ctaTitle,
            ctaMessage,
            ctaButtonText
          }
        });
        console.log('🔄 Updated local demo state with CTA data');
      }
      
    } catch (err: unknown) {
      logError(err, 'Error saving CTA settings');
      alert('Failed to save CTA settings.');
    }
  };

  const createTavusAgent = async () => {
    if (!demo) {
      alert('Demo data is not loaded yet. Please wait a moment.');
      return;
    }
    
    try {
      const response = await fetch('/api/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoId,
          agentName,
          agentPersonality,
          agentGreeting,
          knowledgeChunks,
        }),
      });

      const personaData = await response.json();
      setTavusPersonaId(personaData.personaId);

      // Update demo with persona ID
      const { error: updateError } = await supabase
        .from('demos')
        .update({ tavus_persona_id: personaData.personaId })
        .eq('id', demoId);

      if (updateError) throw updateError;

      // Update local demo state
      if (demo) {
        setDemo({
          ...demo,
          tavus_persona_id: personaData.personaId
        });
      }

    } catch (error: unknown) {
      logError(error, 'An unexpected error occurred during agent creation');
      alert('An unexpected error occurred. Please check the console.');
    }
  };

  const handleStepComplete = (step: number) => {
    console.log(`Step ${step} completed`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><AlertCircle className="w-12 h-12 text-red-500" /><p className="ml-4">{error}</p></div>;

  return (
    <OnboardingFlow
      demoId={demoId}
      demo={demo}
      demoVideos={demoVideos}
      knowledgeChunks={knowledgeChunks}
      onStepComplete={handleStepComplete}
      onVideoUpload={handleVideoUpload}
      onKnowledgeAdd={handleAddQAPair}
      onCTASave={handleSaveCTA}
      onAgentCreate={createTavusAgent}
      selectedVideoFile={selectedVideoFile}
      setSelectedVideoFile={setSelectedVideoFile}
      videoTitle={videoTitle}
      setVideoTitle={setVideoTitle}
      handleVideoUpload={handleVideoUpload}
      processingStatus={processingStatus}
      newQuestion={newQuestion}
      setNewQuestion={setNewQuestion}
      newAnswer={newAnswer}
      setNewAnswer={setNewAnswer}
      handleAddQAPair={handleAddQAPair}
      knowledgeDoc={knowledgeDoc}
      setKnowledgeDoc={setKnowledgeDoc}
      handleKnowledgeDocUpload={handleKnowledgeDocUpload}
      ctaTitle={ctaTitle}
      setCTATitle={setCTATitle}
      ctaMessage={ctaMessage}
      setCTAMessage={setCTAMessage}
      ctaButtonText={ctaButtonText}
      setCTAButtonText={setCTAButtonText}
      handleSaveCTA={handleSaveCTA}
      agentName={agentName}
      setAgentName={setAgentName}
      agentPersonality={agentPersonality}
      setAgentPersonality={setAgentPersonality}
      agentGreeting={agentGreeting}
      setAgentGreeting={setAgentGreeting}
      objectives={objectives}
      setObjectives={setObjectives}
      createTavusAgent={createTavusAgent}
    />
  );
}
