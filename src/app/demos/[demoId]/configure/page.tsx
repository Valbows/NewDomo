'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

// Components
import { VideoManagement } from './components/VideoManagement';
import { KnowledgeBaseManagement } from './components/KnowledgeBaseManagement';
import { AgentSettings } from './components/AgentSettings';
import { VideoPlayer } from './components/VideoPlayer';
import { CTASettings } from './components/CTASettings';
import { Reporting } from './components/Reporting';
import { AdminCTAUrlEditor } from './components/AdminCTAUrlEditor';
import { ConfigurationHeader } from './components/ConfigurationHeader';

// Hooks
import { useDemoConfiguration } from './hooks/useDemoConfiguration';
import { useVideoManagement } from './hooks/useVideoManagement';
import { useKnowledgeManagement } from './hooks/useKnowledgeManagement';
import { useAgentManagement } from './hooks/useAgentManagement';

// Utils
import { getErrorMessage } from '@/lib/errors';

export default function DemoConfigurationPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const searchParams = useSearchParams();
  
  // Main demo configuration
  const {
    demo,
    loading,
    error,
    demoVideos,
    knowledgeChunks,
    uiState,
    tavusPersonaId,
    conversationData,
    setError,
    setDemoVideos,
    setKnowledgeChunks,
    setUiState,
    setTavusPersonaId,
    setConversationData,
  } = useDemoConfiguration(demoId);

  // Video management
  const {
    selectedVideoFile,
    setSelectedVideoFile,
    videoTitle,
    setVideoTitle,
    processingStatus,
    previewVideoUrl,
    setPreviewVideoUrl,
    handleVideoUpload,
    handlePreviewVideo,
    handleDeleteVideo,
  } = useVideoManagement(demoId, demoVideos, setDemoVideos, setError);

  // Knowledge management
  const {
    newQuestion,
    setNewQuestion,
    newAnswer,
    setNewAnswer,
    knowledgeDoc,
    setKnowledgeDoc,
    handleAddQAPair,
    handleDeleteKnowledgeChunk,
    handleKnowledgeDocUpload,
  } = useKnowledgeManagement(demoId, knowledgeChunks, setKnowledgeChunks, setError);

  // Agent management
  const {
    agentName,
    setAgentName,
    agentPersonality,
    setAgentPersonality,
    agentGreeting,
    setAgentGreeting,
    objectives,
    setObjectives,
    createTavusAgent,
    saveAgentSettings,
  } = useAgentManagement(
    demo,
    demoId,
    knowledgeChunks,
    setUiState,
    setTavusPersonaId,
    setConversationData,
    setError
  );

  // CTA Settings State
  const [ctaTitle, setCTATitle] = useState('Ready to Get Started?');
  const [ctaMessage, setCTAMessage] = useState('Start your free trial today and see the difference!');
  const [ctaButtonText, setCTAButtonText] = useState('Start Free Trial');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Get the initial tab from URL parameters
  const initialTab = searchParams?.get('tab') || 'videos';

  // Initialize CTA settings from demo data
  useState(() => {
    if (demo) {
      setCTATitle(demo.metadata?.ctaTitle || 'Ready to Get Started?');
      setCTAMessage(demo.metadata?.ctaMessage || 'Start your free trial today and see the difference!');
      setCTAButtonText(demo.metadata?.ctaButtonText || 'Start Free Trial');
    }
  });

  // CTA Management
  const handleSaveCTA = async () => {
    if (!demo) return;

    try {
      const updatedMetadata = {
        ...demo.metadata,
        ctaTitle,
        ctaMessage,
        ctaButtonText,
      };

      const { error } = await supabase
        .from('demos')
        .update({ metadata: updatedMetadata })
        .eq('id', demoId);

      if (error) throw error;
      alert('CTA settings saved successfully!');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save CTA settings.'));
    }
  };

  const handleSaveAdminCTAUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from('demos')
        .update({ cta_button_url: url })
        .eq('id', demoId);

      if (error) throw error;
      alert('Admin CTA URL saved successfully!');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save admin CTA URL.'));
    }
  };

  // Video player handlers
  const handleVideoPlay = (videoUrl: string) => {
    setPlayingVideoUrl(videoUrl);
  };

  const handleVideoClose = () => {
    setPlayingVideoUrl(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading demo configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!demo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Demo Not Found</h2>
          <p className="text-gray-600">The requested demo could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfigurationHeader demo={demo} demoId={demoId} />

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Dismiss</span>
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs.Root defaultValue={initialTab} className="w-full">
          <Tabs.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
            <Tabs.Trigger
              value="videos"
              className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              Videos
            </Tabs.Trigger>
            <Tabs.Trigger
              value="knowledge"
              className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              Knowledge Base
            </Tabs.Trigger>
            <Tabs.Trigger
              value="agent"
              className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              Agent Settings
            </Tabs.Trigger>
            <Tabs.Trigger
              value="cta"
              className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              CTA Settings
            </Tabs.Trigger>
            <Tabs.Trigger
              value="reporting"
              className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 data-[state=active]:bg-white data-[state=active]:shadow"
            >
              Reporting
            </Tabs.Trigger>
          </Tabs.List>

          <div className="mt-2">
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
                previewVideoUrl={null}
                setPreviewVideoUrl={() => {}}
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

      {/* Video Player Modal */}
      {playingVideoUrl && (
        <VideoPlayer
          videoUrl={playingVideoUrl}
          onClose={handleVideoClose}
        />
      )}
    </div>
  );
}