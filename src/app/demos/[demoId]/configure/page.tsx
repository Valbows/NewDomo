'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { Demo, DemoVideo, KnowledgeChunk, ProcessingStatus } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, AlertCircle, Wand2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { VideoManagement } from './components/VideoManagement';
import { KnowledgeBaseManagement } from './components/KnowledgeBaseManagement';
import { AgentSettings } from './components/AgentSettings';
import { VideoPlayer } from './components/VideoPlayer';

export default function DemoConfigurationPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ stage: 'idle', progress: 0, message: '' });
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [knowledgeDoc, setKnowledgeDoc] = useState<File | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('Friendly and helpful assistant.');
  const [agentGreeting, setAgentGreeting] = useState('Hello! How can I help you with the demo today?');
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [tavusPersonaId, setTavusPersonaId] = useState<string | null>(demo?.metadata?.tavusPersonaId || null);
  const [conversationData, setConversationData] = useState<any>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const fetchDemoData = useCallback(async () => {
    try {
      const { data: demoData, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();
      if (demoError) throw demoError;
      if (!demoData) throw new Error('Demo not found.');
      setDemo(demoData);
      setAgentName(demoData.metadata?.agentName || '');
      setAgentPersonality(demoData.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demoData.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');
      setTavusPersonaId(demoData.metadata?.tavusPersonaId || null);

      const { data: videoData, error: videoError } = await supabase.from('demo_videos').select('*').eq('demo_id', demoId).order('order_index');
      if (videoError) console.warn('Could not fetch videos:', videoError.message);
      else setDemoVideos(videoData || []);

      const { data: knowledgeData, error: knowledgeError } = await supabase.from('knowledge_chunks').select('*').eq('demo_id', demoId);
      if (knowledgeError) console.warn('Could not fetch knowledge chunks:', knowledgeError.message);
      else setKnowledgeChunks(knowledgeData || []);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch demo data.');
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => {
    setLoading(true);
    fetchDemoData();

    // Subscribe to real-time events for this demo
    const channel = supabase.channel(`demo-${demoId}`);

    channel
      .on('broadcast', { event: 'play_video' }, (payload) => {
        console.log('Received play_video event:', payload);
        if (payload?.payload?.url) {
          setPlayingVideoUrl(payload.payload.url);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to channel: demo-${demoId}`);
        }
      });

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchDemoData, demoId]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (demo) {
        const newMetadata = {
          ...demo.metadata,
          agentName,
          agentPersonality,
          agentGreeting,
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
  }, [agentName, agentPersonality, agentGreeting, demo, demoId]);

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
      }).catch(err => console.warn('Transcription request failed:', err));

      setDemoVideos([...demoVideos, newVideo]);
      setProcessingStatus({ stage: 'completed', progress: 100, message: 'Video uploaded. Transcription in progress.' });
      setSelectedVideoFile(null);
      setVideoTitle('');

    } catch (err: any) {
      console.error('Video upload error:', err);
      setError(err.message || 'Failed to upload video.');
      setProcessingStatus({ stage: 'error', progress: 0, message: 'Upload failed.' });
    }
  };

  const handlePreviewVideo = async (video: DemoVideo) => {
    try {
      const { data, error } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600);
      if (error) throw error;
      setPreviewVideoUrl(data.signedUrl);
    } catch (err: any) {
      setError(err.message || 'Could not generate preview link.');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const videoToDelete = demoVideos.find(v => v.id === id);
      if (!videoToDelete) return;

      const { error: storageError } = await supabase.storage.from('demo-videos').remove([videoToDelete.storage_url]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('demo_videos').delete().eq('id', id);
      if (dbError) throw dbError;

      setDemoVideos(demoVideos.filter(v => v.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete video.');
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
    } catch (err: any) {
      setError(err.message || 'Failed to add Q&A pair.');
    }
  };

  const handleDeleteKnowledgeChunk = async (id: string) => {
    try {
      const { error } = await supabase.from('knowledge_chunks').delete().eq('id', id);
      if (error) throw error;
      setKnowledgeChunks(knowledgeChunks.filter(chunk => chunk.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete knowledge chunk.');
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
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    }
  };

  const createTavusAgent = async () => {
    if (!demo) {
      alert('Demo data is not loaded yet. Please wait a moment.');
      return;
    }
    setUiState(UIState.LOADING);
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

      // Now, start the conversation
      const convResponse = await fetch('/api/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: personaData.personaId, demoId: demo.id }),
      });

      if (convResponse.ok) {
        const convData = await convResponse.json();
        setConversationData(convData);
        console.log('Conversation started:', convData);
        alert(`Conversation successfully created!\nID: ${convData.conversation_id}`);
        // Next step would be to connect to the websocket using this data
        setUiState(UIState.AGENT_THINKING); // Or whatever the initial connected state is
      } else {
        const errorData = await convResponse.json();
        console.error('Failed to start conversation:', errorData.error);
        alert(`Error starting conversation: ${errorData.error}`);
        setUiState(UIState.SERVICE_ERROR);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('An unexpected error occurred. Please check the console.');
      setUiState(UIState.SERVICE_ERROR);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><AlertCircle className="w-12 h-12 text-red-500" /><p className="ml-4">{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configure: {demo?.name}</h1>
            <p className="text-sm text-gray-500">Manage your demo videos, knowledge base, and agent settings.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {playingVideoUrl && (
          <VideoPlayer 
            videoUrl={playingVideoUrl} 
            onClose={() => setPlayingVideoUrl(null)} 
          />
        )}

        <Tabs.Root defaultValue="videos">
          <Tabs.List className="border-b border-gray-200">
            <Tabs.Trigger value="videos" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Videos</Tabs.Trigger>
            <Tabs.Trigger value="knowledge" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Knowledge Base</Tabs.Trigger>
            <Tabs.Trigger value="agent" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Agent Settings</Tabs.Trigger>
          </Tabs.List>
          <div className="mt-6">
            <Tabs.Content value="videos">
              <VideoManagement 
                demoVideos={demoVideos}
                selectedVideoFile={selectedVideoFile}
                setSelectedVideoFile={setSelectedVideoFile}
                videoTitle={videoTitle}
                setVideoTitle={setVideoTitle}
                handleVideoUpload={handleVideoUpload}
                handlePreviewVideo={handlePreviewVideo}
                handleDeleteVideo={handleDeleteVideo}
                processingStatus={processingStatus}
                previewVideoUrl={previewVideoUrl}
                setPreviewVideoUrl={setPreviewVideoUrl}
              />
            </Tabs.Content>
            <Tabs.Content value="knowledge">
              <KnowledgeBaseManagement 
                knowledgeChunks={knowledgeChunks}
                newQuestion={newQuestion}
                setNewQuestion={setNewQuestion}
                newAnswer={newAnswer}
                setNewAnswer={setNewAnswer}
                handleAddQAPair={handleAddQAPair}
                handleDeleteKnowledgeChunk={handleDeleteKnowledgeChunk}
                knowledgeDoc={knowledgeDoc}
                setKnowledgeDoc={setKnowledgeDoc}
                handleKnowledgeDocUpload={handleKnowledgeDocUpload}
              />
            </Tabs.Content>
            <Tabs.Content value="agent">
              <AgentSettings 
                demo={demo}
                agentName={agentName}
                setAgentName={setAgentName}
                agentPersonality={agentPersonality}
                setAgentPersonality={setAgentPersonality}
                agentGreeting={agentGreeting}
                setAgentGreeting={setAgentGreeting}
              />
              <div className="mt-6">
                {!conversationData ? (
                  <>
                    {uiState === UIState.SERVICE_ERROR && (
                      <button
                        onClick={createTavusAgent}
                        className="mr-4 px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
                      >
                        Retry
                      </button>
                    )}
                    <button 
                      onClick={createTavusAgent} 
                      disabled={uiState === UIState.LOADING} 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                    >
                      {uiState === UIState.LOADING ? 'Initializing...' : 'Start Demo Conversation'}
                    </button>
                  </>
                ) : (
                  <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    <p className="font-bold">Conversation Ready!</p>
                    <p>Session ID: {conversationData.conversation_id}</p>
                    <p>URL: <a href={conversationData.conversation_url} target="_blank" rel="noopener noreferrer" className="underline">{conversationData.conversation_url}</a></p>
                  </div>
                )}
              </div>
              {uiState === UIState.SERVICE_ERROR && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p>An error occurred. Please check the console for details.</p>
                </div>
              )}
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </main>
    </div>
  );
}
