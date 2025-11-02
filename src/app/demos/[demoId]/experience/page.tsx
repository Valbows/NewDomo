"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CVIProvider } from "@/components/features/cvi/components/cvi-provider";
import { TavusConversationCVI } from "./components/TavusConversationCVI";
import { ConversationInterface } from "./components/ConversationInterface";
import { InlineVideoPlayer } from "./components/InlineVideoPlayer";
import { CTABanner } from "./components/CTABanner";
import { DemoHeader } from "./components/DemoHeader";
import { StatusIndicators } from "./components/StatusIndicators";
import { VideoControls } from "./components/VideoControls";
import type { InlineVideoPlayerHandle } from "./components/InlineVideoPlayer";
import { UIState } from "@/lib/tavus";
import { getErrorMessage, logError } from "@/lib/errors";

// Custom styles for PiP video layout
const pipStyles = `
  .pip-video-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .pip-video-layout [class*="mainVideoContainer"] {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  
  .pip-video-layout [class*="selfViewContainer"] {
    position: relative !important;
    bottom: auto !important;
    right: auto !important;
    left: auto !important;
    z-index: 1;
    margin-top: 8px;
    align-self: center;
  }
  
  .pip-video-layout [class*="previewVideoContainer"] {
    width: 80px !important;
    height: 60px !important;
    max-height: 60px !important;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
  }
  
  .pip-video-layout [class*="previewVideo"] {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
`;

// Validate that a URL points to a Daily room (required by our CVI join logic)
const isDailyRoomUrl = (url: string) =>
  /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    tavusAgentId?: string;
    tavusShareableLink?: string;
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
  } | null;
  // Admin-level CTA fields (new)
  cta_title?: string;
  cta_message?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  // Legacy CTA fields
  cta_text?: string;
  cta_link?: string;
}

// CTA override payload shape from Realtime broadcasts
type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoId = params.demoId as string;

  // State management
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaOverrides, setCtaOverrides] = useState<CtaOverrides | null>(null);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(
    null
  );
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(
    null
  );
  const [alert, setAlert] = useState<{
    type: "error" | "info" | "success";
    message: string;
  } | null>(null);

  // Refs
  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);
  const suppressFetchUntilRef = useRef<number>(0);
  const suppressReasonRef = useRef<"close" | "pause" | "resume" | null>(null);
  const pausedPositionRef = useRef<number>(0);

  // Configuration
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
  const forceNew = (() => {
    try {
      const val = (
        searchParams?.get("forceNew") ||
        searchParams?.get("force") ||
        ""
      )
        .toString()
        .toLowerCase();
      return val === "1" || val === "true" || val === "yes";
    } catch {
      return false;
    }
  })();

  // Fetch demo data and initialize
  useEffect(() => {
    const fetchDemoAndStartConversation = async () => {
      try {
        // E2E mode: provide stub data (only if E2E mode is enabled)
        if (isE2E) {
          const stubDemo: Demo = {
            id: demoId,
            name: "E2E Demo",
            user_id: "e2e-user",
            tavus_conversation_id: "e2e-conv",
            metadata: {
              tavusShareableLink: "about:blank",
              ctaTitle: "Ready to Get Started?",
              ctaMessage: "Take the next step today!",
              ctaButtonText: "Start Free Trial",
              ctaButtonUrl: "https://example.com/meta-start",
            },
            cta_title: "Ready to Get Started?",
            cta_message: "Take the next step today!",
            cta_button_text: "Start Free Trial",
            cta_button_url: "https://example.com/admin-start",
          };
          setDemo(stubDemo);
          setVideoTitles(["E2E Test Video", "E2E Second Video"]);
          setConversationUrl("about:blank");
          setUiState(UIState.CONVERSATION);
          setLoading(false);
          return;
        }

        // Get demo data
        const { data: demoData, error: demoError } = await supabase
          .from("demos")
          .select("*")
          .eq("id", demoId)
          .single();

        if (demoError || !demoData) {
          setError("Demo not found");
          setLoading(false);
          return;
        }

        // Parse metadata if it's a string
        let processedDemoData = { ...demoData };
        if (typeof processedDemoData.metadata === "string") {
          try {
            processedDemoData.metadata = JSON.parse(processedDemoData.metadata);
          } catch (e: unknown) {
            logError(e, "Failed to parse metadata");
            processedDemoData.metadata = {};
          }
        }

        setDemo(processedDemoData);

        // Load video titles
        try {
          const { data: titlesData } = await supabase
            .from("demo_videos")
            .select("title")
            .eq("demo_id", demoId)
            .order("created_at", { ascending: true });

          if (titlesData) {
            setVideoTitles(titlesData.map((v) => v.title));
          }
        } catch (e) {
          console.warn("Failed to load video titles:", e);
        }

        // Start conversation
        await startConversation(processedDemoData);
      } catch (e: unknown) {
        logError(e, "Failed to fetch demo or start conversation");
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId, forceNew]);

  // Start conversation logic
  const startConversation = async (demoData: Demo) => {
    try {
      if (!demoData.metadata?.tavusShareableLink) {
        setError("Demo not configured with Tavus conversation");
        return;
      }

      const shareableLink = demoData.metadata.tavusShareableLink;
      if (!isDailyRoomUrl(shareableLink)) {
        setError("Invalid conversation URL format");
        return;
      }

      setConversationUrl(shareableLink);
      setUiState(UIState.CONVERSATION);
    } catch (e: unknown) {
      logError(e, "Failed to start conversation");
      setError(getErrorMessage(e));
    }
  };

  // Event handlers
  const handleVideoPlay = (
    videoUrl: string,
    title?: string,
    index?: number
  ) => {
    console.log("🎬 handleVideoPlay called:", { videoUrl, title, index });
    setPlayingVideoUrl(videoUrl);
    setCurrentVideoTitle(title || null);
    setCurrentVideoIndex(index ?? null);
    setUiState(UIState.VIDEO_PLAYING);
    console.log("🎬 State updated - uiState: VIDEO_PLAYING, playingVideoUrl:", videoUrl);
  };

  const handleVideoClose = () => {
    setPlayingVideoUrl(null);
    setCurrentVideoTitle(null);
    setCurrentVideoIndex(null);
    setUiState(UIState.CONVERSATION);
  };

  const handleVideoEnd = () => {
    setShowCTA(true);
    handleVideoClose();
  };

  const handleNavigateToConfig = () => {
    router.push(`/demos/${demoId}/configure`);
  };

  const handleDismissAlert = () => {
    setAlert(null);
  };

  // CTA configuration
  const ctaTitle =
    ctaOverrides?.cta_title ??
    demo?.cta_title ??
    demo?.metadata?.ctaTitle ??
    "Ready to Get Started?";
  const ctaMessage =
    ctaOverrides?.cta_message ??
    demo?.cta_message ??
    demo?.metadata?.ctaMessage ??
    "Take the next step today!";
  const ctaButtonText =
    ctaOverrides?.cta_button_text ??
    demo?.cta_button_text ??
    demo?.metadata?.ctaButtonText ??
    "Start Free Trial";
  const ctaButtonUrl =
    ctaOverrides?.cta_button_url ??
    demo?.cta_button_url ??
    demo?.metadata?.ctaButtonUrl ??
    demo?.cta_link ??
    "#";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Demo Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <CVIProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <style dangerouslySetInnerHTML={{ __html: pipStyles }} />

        <DemoHeader
          demo={demo}
          demoId={demoId}
          onNavigateToConfig={handleNavigateToConfig}
        />

        <StatusIndicators
          loading={loading}
          error={error}
          alert={alert}
          onDismissAlert={handleDismissAlert}
        />

        <main className="relative min-h-screen">
          {/* Conversation Interface */}
          {uiState === UIState.CONVERSATION && conversationUrl && (
            <div className="h-screen">
              <ConversationInterface
                conversationUrl={conversationUrl}
                uiState={uiState}
                onLeave={() => router.push("/dashboard")}
                onToolCall={async (toolName, args) => {
                  if (toolName === "fetch_video" && args?.title) {
                    console.log("🎬 Video tool call received:", toolName, args);
                    
                    // Find the video in our database by title
                    const { data: videoData, error: videoError } = await supabase
                      .from("demo_videos")
                      .select("storage_url")
                      .eq("demo_id", demoId)
                      .eq("title", args.title)
                      .single();
                    
                    if (videoError || !videoData) {
                      console.error("Video not found:", args.title, videoError);
                      setAlert({
                        type: "error",
                        message: `Video "${args.title}" not found`
                      });
                      return;
                    }
                    
                    console.log("✅ Video found in database:", videoData.storage_url);
                    
                    // Use the real storage URL from the database
                    handleVideoPlay(videoData.storage_url, args.title);
                    console.log("🎬 handleVideoPlay called with:", videoData.storage_url, args.title);
                  }
                }}
                debugVideoTitles={videoTitles}
                onExpandConversation={() => {
                  // Handle expand conversation
                  setUiState(UIState.CONVERSATION);
                }}
              />
            </div>
          )}

          {/* Video Player Overlay */}
          <VideoControls
            uiState={uiState}
            playingVideoUrl={playingVideoUrl}
            videoPlayerRef={videoPlayerRef}
            onVideoClose={handleVideoClose}
            onVideoEnd={handleVideoEnd}
          />
        </main>

        {/* CTA Banner */}
        <CTABanner
          showCTA={showCTA}
          demo={demo}
          ctaTitle={ctaTitle}
          ctaMessage={ctaMessage}
          ctaButtonText={ctaButtonText}
          ctaButtonUrl={ctaButtonUrl}
          onDismiss={() => setShowCTA(false)}
        />
      </div>
    </CVIProvider>
  );
}
