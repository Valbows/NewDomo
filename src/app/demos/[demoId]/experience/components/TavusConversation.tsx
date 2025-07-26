'use client';

import { useEffect, useRef, useState } from 'react';
import DailyCallSingleton from './DailyCallSingleton';

interface TavusConversationProps {
  conversationUrl: string;
  onToolCall: (toolName: string, args: any) => void;
  isMonitoring: boolean;
}

// Global flag to prevent React StrictMode double initialization
let isGloballyMounting = false;

export function TavusConversation({ conversationUrl, onToolCall, isMonitoring }: TavusConversationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dailyCall, setDailyCall] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  const dailyCallSingleton = DailyCallSingleton.getInstance();

  useEffect(() => {
    // Prevent duplicate initialization using ref
    if (initializationRef.current) {
      console.log(`⚠️ [${componentId.current}] Preventing duplicate initialization`);
      return;
    }
    
    // Prevent React StrictMode double mounting
    if (isGloballyMounting) {
      console.log(`⚠️ [${componentId.current}] Global mounting in progress, skipping`);
      return;
    }
    
    // Check if we already have a call for this conversation
    if (dailyCallSingleton.isCallInitialized() && dailyCallSingleton.getConversationUrl() === conversationUrl) {
      console.log(`♻️ [${componentId.current}] Reusing existing Daily.co call instance`);
      setDailyCall(dailyCallSingleton.getDailyCall());
      setIsInitialized(true);
      setIsConnected(true);
      return () => {
        setIsInitialized(false);
      };
    }
    // Mark as initializing
    initializationRef.current = true;
    isGloballyMounting = true;
    console.log(`🚀 [${componentId.current}] Starting Daily.co initialization`);
    
    // Initialize using singleton with component registration
    dailyCallSingleton.initialize(conversationUrl, onToolCall, componentId.current)
      .then((call) => {
        if (call) {
          console.log(`✅ [${componentId.current}] Daily.co call initialized via singleton`);
          setDailyCall(call);
          setIsInitialized(true);
          setIsConnected(true);
        }
        isGloballyMounting = false;
      })
      .catch((error) => {
        console.error(`❌ [${componentId.current}] Failed to initialize Daily.co:`, error);
        initializationRef.current = false;
        isGloballyMounting = false;
      });

    // Cleanup function
    return () => {
      console.log(`🧹 [${componentId.current}] TavusConversation component unmounting`);
      initializationRef.current = false;
      isGloballyMounting = false;
      
      // Unregister this component from the singleton
      dailyCallSingleton.unregisterComponent(componentId.current);
      
      // Only clean up local state
      setDailyCall(null);
      setIsConnected(false);
      setIsInitialized(false);
    };
  }, [conversationUrl, onToolCall]);
  
  // Cleanup when conversation URL changes
  useEffect(() => {
    return () => {
      if (dailyCallSingleton.getConversationUrl() !== conversationUrl) {
        console.log(`🧹 [${componentId.current}] Cleaning up Daily.co call due to URL change`);
        dailyCallSingleton.cleanup();
      }
    };
  }, [conversationUrl]);
  
  // Global cleanup on window unload
  useEffect(() => {
    const handleUnload = () => {
      console.log('🧹 Global cleanup on window unload');
      dailyCallSingleton.cleanup();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <div className="relative">
      {/* Daily.co will inject the video call here */}
      <div id="daily-call-container" className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        {!isConnected && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Connecting to AI assistant...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {isConnected && (
        <div className="absolute top-2 left-2 right-2 bg-green-100 border border-green-300 rounded-md p-2">
          <p className="text-green-800 text-xs font-medium">✅ Connected to AI assistant</p>
        </div>
      )}
      
      {isMonitoring && (
        <div className="absolute bottom-2 left-2 right-2 bg-blue-100 border border-blue-300 rounded-md p-2">
          <div className="flex justify-between items-center">
            <p className="text-blue-800 text-xs font-medium">🔍 Listening for real-time tool calls...</p>
            <button
              onClick={() => {
                console.log('Manual tool call test triggered');
                onToolCall('fetch_video', { title: 'Fourth Video' });
              }}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Test Tool Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
