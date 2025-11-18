'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { UIState } from '@/lib/tavus/UI_STATES';
import { ProcessingStatus } from './types';
import { Loader2, AlertCircle } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { VideoManagement } from './components/VideoManagement';
import { KnowledgeBaseManagement } from './components/KnowledgeBaseManagement';
import { AgentSettings } from './components/AgentSettings';
import { VideoPlayer } from './components/VideoPlayer';
import { CTASettings } from './components/CTASettings';
import { Reporting } from './components/reporting';
import { AdminCTAUrlEditor } from './components/AdminCTAUrlEditor';

// Custom hooks
import { useDemoData } from './hooks/useDemoData';
import { useAutoSaveMetadata } from './hooks/useAutoSaveMetadata';

// Handlers
import { handleVideoUpload as videoUpload, handlePreviewVideo as previewVideo, handleDeleteVideo as deleteVideo } from './handlers/videoHandlers';
import { handleAddQAPair as addQAPair, handleDeleteKnowledgeChunk as deleteKnowledgeChunk, handleKnowledgeDocUpload as knowledgeDocUpload } from './handlers/knowledgeHandlers';
import { handleSaveCTA as saveCTA, handleSaveAdminCTAUrl as saveAdminCTAUrl } from './handlers/ctaHandlers';

export default function DemoConfigurationPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const searchParams = useSearchParams();

  // Use custom hook for data fetching and real-time subscriptions
  const {
    demo,
    setDemo,
    demoVideos,
    setDemoVideos,
    knowledgeChunks,
    setKnowledgeChunks,
    loading,
    error,
    setError,
    playingVideoUrl,
    setPlayingVideoUrl,
    uiState,
    setUiState,
  } = useDemoData(demoId);

  // Local component state
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
  const [objectives, setObjectives] = useState<string[]>(['', '', '']);

  // Get the initial tab from URL parameters
  const initialTab = searchParams?.get('tab') || 'videos';

  // CTA Settings State
  const [ctaTitle, setCTATitle] = useState('Ready to Get Started?');
  const [ctaMessage, setCTAMessage] = useState('Start your free trial today and see the difference!');
  const [ctaButtonText, setCTAButtonText] = useState('Start Free Trial');

  // Initialize state from demo data when loaded
  useEffect(() => {
    if (demo) {
      setAgentName(demo.metadata?.agentName || '');
      setAgentPersonality(demo.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demo.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');

      // Initialize objectives: ensure 3–5 slots
      const rawObjectives: string[] = Array.isArray(demo.metadata?.objectives) ? demo.metadata!.objectives! : [];
      const trimmed = rawObjectives.filter((o) => typeof o === 'string').slice(0, 5);
      const padded = trimmed.length >= 3 ? trimmed : [...trimmed, ...Array(Math.max(0, 3 - trimmed.length)).fill('')];
      setObjectives(padded);

      // Initialize CTA settings from demo metadata
      setCTATitle(demo.metadata?.ctaTitle || 'Ready to Get Started?');
      setCTAMessage(demo.metadata?.ctaMessage || 'Start your free trial today and see the difference!');
      setCTAButtonText(demo.metadata?.ctaButtonText || 'Start Free Trial');
    }
  }, [demo]);

  // Auto-save metadata when agent settings change
  useAutoSaveMetadata(demo, demoId, agentName, agentPersonality, agentGreeting, objectives);

  // Wrapper functions that call extracted handlers
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle) {
      setError('Please select a video file and provide a title.');
      return;
    }
    await videoUpload({
      selectedVideoFile,
      videoTitle,
      demoId,
      demoVideos,
      setProcessingStatus,
      setError,
      setDemoVideos,
      setSelectedVideoFile,
      setVideoTitle,
    });
  };

  const handlePreviewVideo = async (video: any) => {
    await previewVideo(video, setPreviewVideoUrl, setError);
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteVideo(id, demoVideos, setDemoVideos, setError);
  };

  const handleAddQAPair = async () => {
    await addQAPair(
      newQuestion,
      newAnswer,
      demoId,
      knowledgeChunks,
      setKnowledgeChunks,
      setNewQuestion,
      setNewAnswer,
      setError
    );
  };

  const handleDeleteKnowledgeChunk = async (id: string) => {
    await deleteKnowledgeChunk(id, knowledgeChunks, setKnowledgeChunks, setError);
  };

  const handleKnowledgeDocUpload = async () => {
    await knowledgeDocUpload(
      knowledgeDoc,
      demoId,
      knowledgeChunks,
      setKnowledgeChunks,
      setKnowledgeDoc,
      setError
    );
  };

  const handleSaveCTA = async () => {
    await saveCTA(ctaTitle, ctaMessage, ctaButtonText, demo, demoId, setDemo);
  };

  const handleSaveAdminCTAUrl = async (url: string) => {
    await saveAdminCTAUrl(url, demoId, demo, setDemo);
  };

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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configure: {demo?.name}</h1>
            <p className="text-sm text-gray-500">Manage your demo videos, knowledge base, and agent settings.</p>
          </div>
          <div className="flex space-x-4">
            <a
              href={`/demos/${demoId}/experience`}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              View Demo Experience
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* UI State Indicator */}
        {uiState === UIState.VIDEO_PLAYING && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
            <p className="text-blue-800 font-medium">🎥 Video Playing - Agent is showing demo content</p>
          </div>
        )}
        {uiState === UIState.DEMO_COMPLETE && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-800 font-medium">✅ Demo Complete - Ready for trial signup!</p>
            <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Start Your Trial
            </button>
          </div>
        )}
        {uiState === UIState.AGENT_THINKING && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
            <p className="text-yellow-800 font-medium">🤔 Agent is thinking...</p>
          </div>
        )}
        
        {playingVideoUrl && (
          <VideoPlayer 
            videoUrl={playingVideoUrl} 
            onClose={() => {
              setPlayingVideoUrl(null);
              setUiState(UIState.IDLE);
            }} 
          />
        )}

        <Tabs.Root defaultValue={initialTab}>
          <Tabs.List className="border-b border-gray-200">
            <Tabs.Trigger value="videos" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Videos</Tabs.Trigger>
            <Tabs.Trigger value="knowledge" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Knowledge Base</Tabs.Trigger>
            <Tabs.Trigger value="agent" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Agent Settings</Tabs.Trigger>
            <Tabs.Trigger value="cta" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Call-to-Action</Tabs.Trigger>
            <Tabs.Trigger value="reporting" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">Reporting</Tabs.Trigger>
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
                objectives={objectives}
                setObjectives={setObjectives}
              />
              <div className="mt-6">
                {demo?.tavus_persona_id ? (
                  <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    <p className="font-bold">✅ Agent Configured!</p>
                    <p>Persona ID: {demo.tavus_persona_id}</p>
                    <p className="text-sm mt-2">Your agent is ready to use. Go to the <strong>Experience</strong> tab to test it!</p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
                    <p className="font-medium">🤖 Agent Not Configured</p>
                    <p className="text-sm mt-1">Use the "Create Agent" button above to configure your Domo agent with system prompt, guardrails, and objectives.</p>
                  </div>
                )}
              </div>
              {uiState === UIState.SERVICE_ERROR && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p>An error occurred. Please check the console for details.</p>
                </div>
              )}
            </Tabs.Content>
            <Tabs.Content value="cta">
              <div className="space-y-6">
                <AdminCTAUrlEditor
                  currentUrl={demo?.cta_button_url || null}
                  onSave={handleSaveAdminCTAUrl}
                />
              <CTASettings
                demo={demo}
                ctaTitle={ctaTitle}
                setCTATitle={setCTATitle}
                ctaMessage={ctaMessage}
                setCTAMessage={setCTAMessage}
                ctaButtonText={ctaButtonText}
                setCTAButtonText={setCTAButtonText}
                onSaveCTA={handleSaveCTA}
              />
              </div>
            </Tabs.Content>
            <Tabs.Content value="reporting">
              <Reporting demo={demo} />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </main>
    </div>
  );
}
