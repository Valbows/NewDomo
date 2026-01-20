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
import { OnboardingComplete } from './components/OnboardingComplete';

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

  // Set initial step from URL param only on mount (no auto-advance)
  const hasExplicitTabParam = searchParams?.has('tab');
  useEffect(() => {
    if (hasExplicitTabParam) {
      const tabFromUrl = searchParams?.get('tab') || 'videos';
      setCurrentStep(getStepFromTab(tabFromUrl));
      setActiveTab(tabFromUrl);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [ctaReturnUrl, setCTAReturnUrl] = useState('');

  // Congratulations modal state - shows once when onboarding completes
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsChecked, setCongratsChecked] = useState(false);

  // Check if congratulations was already shown for this demo
  useEffect(() => {
    // Only run on client side and only check once
    if (typeof window === 'undefined' || congratsChecked) return;

    if (demoId) {
      const congratsKey = `congrats_shown_${demoId}`;
      const alreadyShown = localStorage.getItem(congratsKey);
      if (alreadyShown) {
        setCongratsChecked(true);
      }
    }
  }, [demoId, congratsChecked]);

  const dismissCongrats = () => {
    setShowCongrats(false);
  };

  // Initialize state from demo data when loaded
  useEffect(() => {
    if (demo) {
      // Default agent name to demo name + " Agent" if not set
      setAgentName(demo.metadata?.agentName || (demo.name ? `${demo.name} Agent` : ''));
      setAgentPersonality(demo.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demo.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');

      // Initialize selected objective template from metadata
      setSelectedObjectiveTemplate(demo.metadata?.selectedObjectiveTemplate || '');

      // Initialize CTA settings from demo metadata
      setCTATitle(demo.metadata?.ctaTitle || 'Ready to Get Started?');
      setCTAMessage(demo.metadata?.ctaMessage || 'Start your free trial today and see the difference!');
      setCTAButtonText(demo.metadata?.ctaButtonText || 'Start Free Trial');
      setCTAReturnUrl(demo.cta_return_url || '');
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

  const handleSaveCTA = async (url: string, returnUrl: string) => {
    await saveCTA(ctaTitle, ctaMessage, ctaButtonText, url, returnUrl, demo, demoId, setDemo);
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

  const handleGenerateAIContext = async (videoId: string) => {
    try {
      const response = await fetch('/api/twelve-labs/generate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoVideoId: videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Context generation failed');
      }

      const data = await response.json();

      // Update the video metadata with the generated context
      setDemoVideos(prev => prev.map(v =>
        v.id === videoId ? {
          ...v,
          metadata: {
            ...v.metadata,
            twelvelabs: {
              ...v.metadata?.twelvelabs,
              generatedContext: data.context,
              contextGeneratedAt: new Date().toISOString(),
            }
          }
        } : v
      ));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[GenerateAIContext] Error:', err);
      }
      // Could show error toast here
    }
  };

  const handleIndexWithTwelveLabs = async (videoId: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[handleIndexWithTwelveLabs] Starting for video:', videoId);
    try {
      const response = await fetch('/api/twelve-labs/index-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoVideoId: videoId }),
      });

      console.log('[handleIndexWithTwelveLabs] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[handleIndexWithTwelveLabs] API error:', errorData);
        return { success: false, error: errorData.error || 'Indexing failed' };
      }

      const data = await response.json();
      console.log('[handleIndexWithTwelveLabs] Response data:', data);

      if (data.success) {
        console.log('[handleIndexWithTwelveLabs] Success! Updating video metadata');
        // Update the video metadata with indexing info
        setDemoVideos(prev => prev.map(v =>
          v.id === videoId ? {
            ...v,
            metadata: {
              ...v.metadata,
              twelvelabs: {
                indexId: data.indexId,
                videoId: data.videoId,
                taskId: data.taskId,
                status: data.status || 'indexing',
                indexedAt: new Date().toISOString(),
              }
            }
          } : v
        ));
        return { success: true };
      } else {
        console.warn('[handleIndexWithTwelveLabs] API returned success: false', data.message, data.error);
        return { success: false, error: data.error || data.message || 'Indexing failed' };
      }
    } catch (err: any) {
      console.error('[handleIndexWithTwelveLabs] Error:', err);
      return { success: false, error: err.message || 'Unknown error' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-domo-bg-dark">
        <Loader2 className="w-12 h-12 animate-spin text-domo-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-domo-bg-dark">
        <AlertCircle className="w-12 h-12 text-domo-error" />
        <p className="ml-4 text-white">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-domo-bg-dark">
      <header className="bg-domo-bg-card border-b border-domo-border">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Back button row */}
          <div className="mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-domo-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Main header row */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">Configure: {demo?.name}</h1>
              <p className="text-sm text-domo-text-secondary">Manage your demo videos, knowledge base, and agent settings.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/demos/${demoId}/reporting`}
                className="inline-flex items-center px-4 py-2 text-domo-text-secondary bg-domo-bg-elevated border border-domo-border font-medium rounded-lg hover:text-white hover:border-domo-primary transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reporting
              </Link>
              <Link
                href={`/demos/${demoId}/experience`}
                className="px-4 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary transition-colors"
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
          <div className="mb-4 p-3 bg-domo-primary/10 border border-domo-primary/20 rounded-lg">
            <p className="text-domo-primary font-medium">🎥 Video Playing - Agent is showing demo content</p>
          </div>
        )}
        {uiState === UIState.DEMO_COMPLETE && (
          <div className="mb-4 p-4 bg-domo-success/10 border border-domo-success/20 rounded-lg">
            <p className="text-domo-success font-medium">✅ Demo Complete - Ready for trial signup!</p>
            <button className="mt-2 px-4 py-2 bg-domo-success text-white rounded-lg hover:bg-domo-success/90 transition-colors">
              Start Your Trial
            </button>
          </div>
        )}
        {uiState === UIState.AGENT_THINKING && (
          <div className="mb-4 p-3 bg-domo-warning/10 border border-domo-warning/20 rounded-lg">
            <p className="text-domo-warning font-medium">🤔 Agent is thinking...</p>
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
            <Tabs.List className="flex items-center gap-1 border-b border-domo-border pb-0">
              {/* Content Management - Primary tabs */}
              <div className="flex items-center">
                <div className="flex bg-domo-bg-card rounded-t-lg">
                  <Tabs.Trigger value="videos" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-domo-text-secondary hover:text-domo-primary rounded-t border-b-2 border-transparent data-[state=active]:text-domo-primary data-[state=active]:border-domo-primary transition-all">
                    <Video className="w-4 h-4" />
                    Videos
                  </Tabs.Trigger>
                  <Tabs.Trigger value="knowledge" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-domo-text-secondary hover:text-domo-primary rounded-t border-b-2 border-transparent data-[state=active]:text-domo-primary data-[state=active]:border-domo-primary transition-all">
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
                      ? 'text-white border-domo-primary'
                      : 'text-domo-text-muted hover:text-domo-text-secondary border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-domo-bg-elevated rounded-xl shadow-domo-lg border border-domo-border py-1 z-50">
                    <button
                      onClick={() => handleSettingsOptionClick('agent')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        activeTab === 'agent' ? 'bg-domo-bg-card text-domo-primary' : 'text-domo-text-secondary hover:text-white hover:bg-domo-bg-card'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Agent Settings
                    </button>
                    <button
                      onClick={() => handleSettingsOptionClick('cta')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        activeTab === 'cta' ? 'bg-domo-bg-card text-domo-primary' : 'text-domo-text-secondary hover:text-white hover:bg-domo-bg-card'
                      }`}
                    >
                      <Megaphone className="w-4 h-4" />
                      Call-to-Action
                    </button>
                    <button
                      onClick={() => handleSettingsOptionClick('embed')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        activeTab === 'embed' ? 'bg-domo-bg-card text-domo-primary' : 'text-domo-text-secondary hover:text-white hover:bg-domo-bg-card'
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
                onGenerateAIContext={handleGenerateAIContext}
                onIndexWithTwelveLabs={handleIndexWithTwelveLabs}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && (
                <div className="mt-6 flex justify-between items-center">
                  {!stepStatus.videos && (
                    <p className="text-sm text-amber-400">Upload at least one video to continue</p>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => handleStepClick(2)}
                      disabled={!stepStatus.videos}
                      className="px-6 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="knowledge">
              <KnowledgeBaseManagement
                knowledgeChunks={knowledgeChunks}
                demoVideos={demoVideos}
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
              {!isOnboardingComplete && (
                <div className="mt-6 flex justify-between items-center">
                  {!stepStatus.knowledge && (
                    <p className="text-sm text-amber-400">Add at least one knowledge item to continue</p>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => handleStepClick(3)}
                      disabled={!stepStatus.knowledge}
                      className="px-6 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
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
                }}
                isOnboarding={!isOnboardingComplete}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && (
                <div className="mt-6 flex justify-between items-center">
                  {!stepStatus.agent && (
                    <p className="text-sm text-amber-400">Create your agent to continue</p>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => handleStepClick(4)}
                      disabled={!stepStatus.agent}
                      className="px-6 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
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
                ctaReturnUrl={ctaReturnUrl}
                setCTAReturnUrl={setCTAReturnUrl}
                onSaveCTA={handleSaveCTA}
                isOnboarding={!isOnboardingComplete}
              />
              {/* Next step button during onboarding */}
              {!isOnboardingComplete && (
                <div className="mt-6 flex justify-between items-center">
                  {!stepStatus.cta && (
                    <p className="text-sm text-amber-400">Save your CTA settings to continue</p>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => handleStepClick(5)}
                      disabled={!stepStatus.cta}
                      className="px-6 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="embed">
              <EmbedSettings demo={demo} onDemoUpdate={setDemo} />
              {/* Done button during onboarding - triggers celebration */}
              {!congratsChecked && stepStatus.embed && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      const congratsKey = `congrats_shown_${demoId}`;
                      localStorage.setItem(congratsKey, 'true');
                      setCongratsChecked(true);
                      setShowCongrats(true);
                    }}
                    className="px-8 py-3 bg-domo-success text-white font-semibold rounded-xl hover:bg-domo-success/90 transition-colors text-lg"
                  >
                    Done - Complete Setup
                  </button>
                </div>
              )}
            </Tabs.Content>

          </div>
        </Tabs.Root>
      </main>

      {/* Full-page Congratulations Screen - shows once when onboarding completes */}
      {showCongrats && (
        <OnboardingComplete
          demoId={demoId}
          demoName={demo?.name || 'Demo'}
          embedToken={demo?.embed_token ?? undefined}
          onDismiss={dismissCongrats}
        />
      )}
    </div>
  );
}
