'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UIState } from '@/lib/tavus/UI_STATES';
import { ProcessingStatus } from './types';
import { Loader2, AlertCircle, Settings, BarChart3, Video, BookOpen, ArrowLeft, ChevronDown, User, Megaphone, Code2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { VideoManagement } from './components/VideoManagement';
import { KnowledgeBaseManagement } from './components/KnowledgeBaseManagement';
import { AgentSettings } from './components/AgentSettings';
import { VideoPlayer } from './components/VideoPlayer';
import { CTASettings } from './components/CTASettings';
// AdminCTAUrlEditor removed - functionality merged into CTASettings
import { EmbedSettings } from './components/embed/EmbedSettings';
import { OnboardingStepper, getStepFromTab, getTabFromStep } from './components/OnboardingStepper';

// Custom hooks
import { useDemoData } from './hooks/useDemoData';
import { useAutoSaveMetadata } from './hooks/useAutoSaveMetadata';
import { useOnboardingStatus } from './hooks/useOnboardingStatus';

// Handlers
import { handleVideoUpload as videoUpload, handlePreviewVideo as previewVideo, handleDeleteVideo as deleteVideo } from './handlers/videoHandlers';
import { handleAddQAPair as addQAPair, handleDeleteKnowledgeChunk as deleteKnowledgeChunk, handleKnowledgeDocUpload as knowledgeDocUpload, handleUrlImport as urlImport } from './handlers/knowledgeHandlers';
import { handleSaveCTA as saveCTA } from './handlers/ctaHandlers';

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
    fetchDemoData,
  } = useDemoData(demoId);

  // Local component state
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ stage: 'idle', progress: 0, message: '' });
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [knowledgeDoc, setKnowledgeDoc] = useState<File | null>(null);
  const [knowledgeUrl, setKnowledgeUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('Friendly and helpful assistant.');
  const [agentGreeting, setAgentGreeting] = useState('Hello! How can I help you with the demo today?');
  const [selectedObjectiveTemplate, setSelectedObjectiveTemplate] = useState('');

  // Get the initial tab from URL parameters
  const initialTab = searchParams?.get('tab') || 'videos';

  // Onboarding status
  const { stepStatus, isOnboardingComplete, firstIncompleteStep } = useOnboardingStatus(
    demo,
    demoVideos,
    knowledgeChunks
  );

  // Current step for onboarding flow
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync step with tab - but respect explicit URL parameter
  const hasExplicitTabParam = searchParams?.has('tab');
  useEffect(() => {
    if (!isOnboardingComplete && !hasExplicitTabParam) {
      setCurrentStep(firstIncompleteStep);
      setActiveTab(getTabFromStep(firstIncompleteStep));
    }
  }, [isOnboardingComplete, firstIncompleteStep, hasExplicitTabParam]);

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    setActiveTab(getTabFromStep(step));
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Settings dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  const handleSettingsOptionClick = (tab: string) => {
    setActiveTab(tab);
    setSettingsOpen(false);
  };

  // CTA Settings State
  const [ctaTitle, setCTATitle] = useState('Ready to Get Started?');
  const [ctaMessage, setCTAMessage] = useState('Start your free trial today and see the difference!');
  const [ctaButtonText, setCTAButtonText] = useState('Start Free Trial');

  // Congratulations modal state - shows once when onboarding completes
  const [showCongrats, setShowCongrats] = useState(false);

  // Show congratulations modal once when onboarding completes
  useEffect(() => {
    if (isOnboardingComplete && demoId) {
      const congratsKey = `congrats_shown_${demoId}`;
      const alreadyShown = localStorage.getItem(congratsKey);
      if (!alreadyShown) {
        setShowCongrats(true);
        localStorage.setItem(congratsKey, 'true');
      }
    }
  }, [isOnboardingComplete, demoId]);

  const dismissCongrats = () => {
    setShowCongrats(false);
  };

  // Initialize state from demo data when loaded
  useEffect(() => {
    if (demo) {
      setAgentName(demo.metadata?.agentName || '');
      setAgentPersonality(demo.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demo.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');

      // Initialize selected objective template from metadata
      setSelectedObjectiveTemplate(demo.metadata?.selectedObjectiveTemplate || '');

      // Initialize CTA settings from demo metadata
      setCTATitle(demo.metadata?.ctaTitle || 'Ready to Get Started?');
      setCTAMessage(demo.metadata?.ctaMessage || 'Start your free trial today and see the difference!');
      setCTAButtonText(demo.metadata?.ctaButtonText || 'Start Free Trial');
    }
  }, [demo]);

  // Auto-save metadata when agent settings change
  useAutoSaveMetadata(demo, demoId, agentName, agentPersonality, agentGreeting, selectedObjectiveTemplate);

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
      setError,
      setIsUploadingFile
    );
  };

  const handleUrlImport = async () => {
    await urlImport(
      knowledgeUrl,
      demoId,
      knowledgeChunks,
      setKnowledgeChunks,
      setKnowledgeUrl,
      setError,
      setIsUploadingUrl
    );
  };

  const handleSaveCTA = async (url: string) => {
    await saveCTA(ctaTitle, ctaMessage, ctaButtonText, url, demo, demoId, setDemo);
  };

  const handleRetryTranscription = async (videoId: string) => {
    // Update UI to show processing
    setDemoVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, processing_status: 'processing' as const, processing_error: null } : v
    ));

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_video_id: videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      // Update video with success - API updates DB so we refetch
      setDemoVideos(prev => prev.map(v =>
        v.id === videoId ? { ...v, processing_status: 'completed' as const } : v
      ));
    } catch (err) {
      // Update video with error
      setDemoVideos(prev => prev.map(v =>
        v.id === videoId ? {
          ...v,
          processing_status: 'failed' as const,
          processing_error: err instanceof Error ? err.message : 'Unknown error'
        } : v
      ));
    }
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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Back button row */}
          <div className="mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Main header row */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configure: {demo?.name}</h1>
              <p className="text-sm text-gray-500">Manage your demo videos, knowledge base, and agent settings.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/demos/${demoId}/reporting`}
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reporting
              </Link>
              <Link
                href={`/demos/${demoId}/experience`}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                View Demo Experience
              </Link>
            </div>
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

        {/* Onboarding Stepper - shown during onboarding */}
        {!isOnboardingComplete && (
          <OnboardingStepper
            currentStep={currentStep}
            stepStatus={stepStatus}
            onStepClick={handleStepClick}
          />
        )}

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Show different navigation based on onboarding status */}
          {isOnboardingComplete ? (
            /* Post-onboarding: Main navigation with settings dropdown */
            <Tabs.List className="flex items-center gap-1 border-b border-gray-200 pb-0">
              {/* Content Management - Primary tabs */}
              <div className="flex items-center">
                <div className="flex bg-white rounded-t-lg">
                  <Tabs.Trigger value="videos" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 rounded-t border-b-2 border-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-600 transition-all">
                    <Video className="w-4 h-4" />
                    Videos
                  </Tabs.Trigger>
                  <Tabs.Trigger value="knowledge" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 rounded-t border-b-2 border-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-600 transition-all">
                    <BookOpen className="w-4 h-4" />
                    Knowledge Base
                  </Tabs.Trigger>
                </div>
              </div>

              {/* Hidden triggers for settings pages */}
              <Tabs.Trigger value="agent" className="sr-only">Agent</Tabs.Trigger>
              <Tabs.Trigger value="cta" className="sr-only">CTA</Tabs.Trigger>
              <Tabs.Trigger value="embed" className="sr-only">Embed</Tabs.Trigger>

              {/* Settings Dropdown */}
              <div className="ml-auto relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-all ${
                    ['agent', 'cta', 'embed'].includes(activeTab)
                      ? 'text-gray-700 border-gray-400'
                      : 'text-gray-400 hover:text-gray-600 border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => handleSettingsOptionClick('agent')}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                        activeTab === 'agent' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Agent Settings
                    </button>
                    <button
                      onClick={() => handleSettingsOptionClick('cta')}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                        activeTab === 'cta' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      <Megaphone className="w-4 h-4" />
                      Call-to-Action
                    </button>
                    <button
                      onClick={() => handleSettingsOptionClick('embed')}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                        activeTab === 'embed' ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      <Code2 className="w-4 h-4" />
                      Embed Settings
                    </button>
                  </div>
                )}
              </div>
            </Tabs.List>
          ) : (
            /* During onboarding: Simple step indicators */
            <Tabs.List className="sr-only">
              <Tabs.Trigger value="videos">Videos</Tabs.Trigger>
              <Tabs.Trigger value="knowledge">Knowledge Base</Tabs.Trigger>
              <Tabs.Trigger value="agent">Agent Settings</Tabs.Trigger>
              <Tabs.Trigger value="cta">Call-to-Action</Tabs.Trigger>
              <Tabs.Trigger value="embed">Embed</Tabs.Trigger>
            </Tabs.List>
          )}

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
                onRetryTranscription={handleRetryTranscription}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && stepStatus.videos && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleStepClick(2)}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
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
                knowledgeUrl={knowledgeUrl}
                setKnowledgeUrl={setKnowledgeUrl}
                handleUrlImport={handleUrlImport}
                isUploadingFile={isUploadingFile}
                isUploadingUrl={isUploadingUrl}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && stepStatus.knowledge && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleStepClick(3)}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
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
                selectedObjectiveTemplate={selectedObjectiveTemplate}
                setSelectedObjectiveTemplate={setSelectedObjectiveTemplate}
                onAgentCreated={async () => {
                  // Refresh demo data to get updated persona_id
                  await fetchDemoData();
                  // Auto-advance to next step (CTA) during onboarding
                  if (!isOnboardingComplete) {
                    handleStepClick(4);
                  }
                }}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && stepStatus.agent && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleStepClick(4)}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="cta">
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
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && stepStatus.cta && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleStepClick(5)}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="embed">
              <EmbedSettings demo={demo} onDemoUpdate={setDemo} />
            </Tabs.Content>

          </div>
        </Tabs.Root>
      </main>

      {/* Full-page Congratulations Modal - shows once when onboarding completes */}
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500" />

          {/* Content */}
          <div className="relative z-10 text-center text-white px-8">
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="text-4xl font-bold mb-4">Congratulations!</h2>
            <p className="text-xl opacity-90 mb-10">Your demo is fully set up and ready to go!</p>
            <div className="flex justify-center gap-4">
              <a
                href={`/demos/${demoId}/experience`}
                className="px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
              >
                View Demo
              </a>
              <button
                onClick={dismissCongrats}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
