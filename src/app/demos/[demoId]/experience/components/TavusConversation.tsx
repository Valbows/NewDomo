'use client';

import { useEffect, useRef, useState } from 'react';
import DailyCallSingleton from './DailyCallSingleton';

interface TavusConversationProps {
  conversationUrl: string;
  onToolCall: (toolName: string, args: any) => void;
  isMonitoring: boolean;
}

// WINDOW-ONLY APPROACH: Use only window object for persistence
// No module-level variables that can be reset

// Initialize window-level singleton on module load with module tracking
if (typeof window !== 'undefined') {
  // Check if this is the first module load
  const isFirstLoad = !(window as any).__DOMO_MODULE_LOADED__;
  
  if (isFirstLoad) {
    (window as any).__DOMO_MODULE_LOADED__ = true;
    console.log('🌐 First module load - initializing window state');
  } else {
    console.log('🔄 Module reloaded - preserving existing window state');
  }
  
  // Initialize all window flags if they don't exist (only on first load)
  if ((window as any).__DOMO_DAILY_CALL_INSTANCE__ === undefined) {
    (window as any).__DOMO_DAILY_CALL_INSTANCE__ = null;
  }
  if ((window as any).__DOMO_IFRAME_CONTAINER__ === undefined) {
    (window as any).__DOMO_IFRAME_CONTAINER__ = null;
  }
  if ((window as any).__DOMO_COMPONENT_INITIALIZED__ === undefined) {
    (window as any).__DOMO_COMPONENT_INITIALIZED__ = false;
  }
  if ((window as any).__DOMO_CONVERSATION_URL__ === undefined) {
    (window as any).__DOMO_CONVERSATION_URL__ = null;
  }
  if ((window as any).__DOMO_MOUNTING_FLAG__ === undefined) {
    (window as any).__DOMO_MOUNTING_FLAG__ = false;
  }
  
  // Only log state on first load to avoid spam
  if (isFirstLoad) {
    console.log('🌐 Window state initialized:', {
      hasInstance: !!(window as any).__DOMO_DAILY_CALL_INSTANCE__,
      hasContainer: !!(window as any).__DOMO_IFRAME_CONTAINER__,
      isInitialized: (window as any).__DOMO_COMPONENT_INITIALIZED__,
      conversationUrl: (window as any).__DOMO_CONVERSATION_URL__,
      isMounting: (window as any).__DOMO_MOUNTING_FLAG__
    });
  }
}

export function TavusConversation({ conversationUrl, onToolCall, isMonitoring }: TavusConversationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dailyCall, setDailyCall] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const initializationRef = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  const dailyCallSingleton = DailyCallSingleton.getInstance();
  
  // IMMEDIATE CHECK: If already initialized, set state immediately and skip useEffect
  const [shouldSkipInitialization] = useState(() => {
    if (typeof window !== 'undefined') {
      // Track component mounts for debugging React StrictMode
      const mountCount = ((window as any).__DOMO_MOUNT_COUNT__ || 0) + 1;
      (window as any).__DOMO_MOUNT_COUNT__ = mountCount;
      
      const isAlreadyInitialized = (window as any).__DOMO_COMPONENT_INITIALIZED__;
      const existingUrl = (window as any).__DOMO_CONVERSATION_URL__;
      const existingInstance = (window as any).__DOMO_DAILY_CALL_INSTANCE__;
      
      console.log(`🔍 [${componentId.current}] Mount #${mountCount} - Initialization check:`, {
        isAlreadyInitialized,
        urlMatches: existingUrl === conversationUrl,
        hasInstance: !!existingInstance
      });
      
      if (isAlreadyInitialized && existingUrl === conversationUrl && existingInstance) {
        console.log(`🚫🚫 [${componentId.current}] Mount #${mountCount} - SKIP INITIALIZATION - Already done`);
        // Set state immediately
        setDailyCall(existingInstance);
        setIsInitialized(true);
        setIsConnected(true);
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    console.log(`🕒 [TavusConversation] useEffect at ${new Date().toISOString()}. URL=${conversationUrl}, mountFlag=${(typeof window !== 'undefined' ? (window as any).__DOMO_MOUNTING_FLAG__ : 'undefined')}, initPromise=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_INIT_PROMISE__ : 'undefined')}, dailyInstance=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_DAILY_CALL_INSTANCE__ : 'undefined')}, iframeMounted=${(typeof window !== 'undefined' ? !!(window as any).__DAILY_IFRAME_MOUNTED__ : 'undefined')}`);
    // ULTRA-AGGRESSIVE CHECK: Use global promise to prevent multiple initializations
    if (typeof window !== 'undefined') {
      // Check if there's already a global initialization in progress
      if ((window as any).__DOMO_INIT_PROMISE__) {
        console.log(`🛑 [${componentId.current}] GLOBAL INIT IN PROGRESS - Waiting for completion`);
        (window as any).__DOMO_INIT_PROMISE__.then((result: any) => {
          if (result && result.call) {
            console.log(`🛑 [${componentId.current}] Using completed global initialization`);
            setDailyCall(result.call);
            setIsInitialized(true);
            setIsConnected(true);
          }
        });
        return () => {
          console.log(`🧹 [${componentId.current}] Component cleanup (global init wait)`);
        };
      }
      
      // Check if already completed
      const isWindowInitialized = (window as any).__DOMO_COMPONENT_INITIALIZED__;
      const windowUrl = (window as any).__DOMO_CONVERSATION_URL__;
      const windowInstance = (window as any).__DOMO_DAILY_CALL_INSTANCE__;
      
      if (isWindowInitialized && windowUrl === conversationUrl && windowInstance) {
        console.log(`🛑 [${componentId.current}] AGGRESSIVE SKIP - Window already initialized`);
        setDailyCall(windowInstance);
        setIsInitialized(true);
        setIsConnected(true);
        return () => {
          console.log(`🧹 [${componentId.current}] Component cleanup (aggressive skip)`);
        };
      }
    }
    
    // FIRST CHECK: If we should skip initialization, do nothing
    if (shouldSkipInitialization) {
      console.log(`⏭️ [${componentId.current}] Skipping useEffect - already initialized`);
      return () => {
        console.log(`🧹 [${componentId.current}] Component cleanup (skipped initialization)`);
        setIsInitialized(false);
      };
    }
    
    // WINDOW CHECK: If already initialized in window, use existing instance
    if (typeof window !== 'undefined') {
      const isAlreadyInitialized = (window as any).__DOMO_COMPONENT_INITIALIZED__;
      const existingUrl = (window as any).__DOMO_CONVERSATION_URL__;
      const existingInstance = (window as any).__DOMO_DAILY_CALL_INSTANCE__;
      
      if (isAlreadyInitialized && existingUrl === conversationUrl && existingInstance) {
        console.log(`🌍 [${componentId.current}] Using existing window instance`);
        setDailyCall(existingInstance);
        setIsInitialized(true);
        setIsConnected(true);
        return () => {
          console.log(`🧹 [${componentId.current}] Component cleanup (window instance preserved)`);
          setIsInitialized(false);
        };
      }
    }
    
    // BROWSER-LEVEL CHECK: If there's already a browser instance, use it and STOP
    if (typeof window !== 'undefined' && (window as any).__DOMO_DAILY_CALL_INSTANCE__) {
      console.log(`🌍 [${componentId.current}] Browser-level Daily.co instance found, using it`);
      const existingCall = (window as any).__DOMO_DAILY_CALL_INSTANCE__;
      
      // Update window state
      (window as any).__DOMO_COMPONENT_INITIALIZED__ = true;
      (window as any).__DOMO_CONVERSATION_URL__ = conversationUrl;
      
      setDailyCall(existingCall);
      setIsInitialized(true);
      setIsConnected(true);
      initializationRef.current = true;
      return () => {
        console.log(`🧹 [${componentId.current}] Component cleanup (browser instance preserved)`);
        setIsInitialized(false);
      };
    }
    
    // DUPLICATE CHECK REMOVED - This is handled above
    
    // FINAL CHECK: If mounting flag is set, wait
    if (typeof window !== 'undefined' && (window as any).__DOMO_MOUNTING_FLAG__) {
      console.log(`⏳ [${componentId.current}] Waiting - another component is mounting`);
      return;
    }
    
    // Prevent duplicate initialization using ref
    if (initializationRef.current) {
      console.log(`⚠️ [${componentId.current}] Preventing duplicate initialization`);
      return;
    }
    
    // ADDITIONAL WINDOW CHECK: Double-check for any existing instance
    if (typeof window !== 'undefined') {
      const existingInstance = (window as any).__DOMO_DAILY_CALL_INSTANCE__;
      if (existingInstance) {
        console.log(`🚫 [${componentId.current}] Found existing Daily.co instance in window, reusing`);
        setDailyCall(existingInstance);
        setIsInitialized(true);
        setIsConnected(true);
        return () => {
          console.log(`🧹 [${componentId.current}] Component cleanup (window instance preserved)`);
          setIsInitialized(false);
        };
      }
    }
    
    // Prevent React StrictMode double mounting
    if (typeof window !== 'undefined' && (window as any).__DOMO_MOUNTING_FLAG__) {
      console.log(`⚠️ [${componentId.current}] Global mounting in progress, skipping`);
      return;
    }
    
    // Check if singleton already has a call for this conversation
    if (dailyCallSingleton.isCallInitialized() && dailyCallSingleton.getConversationUrl() === conversationUrl) {
      console.log(`♻️ [${componentId.current}] Reusing existing Daily.co call from singleton`);
      const existingCall = dailyCallSingleton.getDailyCall();
      
      // Store in window
      if (typeof window !== 'undefined') {
        (window as any).__DOMO_DAILY_CALL_INSTANCE__ = existingCall;
        (window as any).__DOMO_COMPONENT_INITIALIZED__ = true;
        (window as any).__DOMO_CONVERSATION_URL__ = conversationUrl;
      }
      
      setDailyCall(existingCall);
      setIsInitialized(true);
      setIsConnected(true);
      return () => {
        console.log(`🧹 [${componentId.current}] Component cleanup (preserving window instance)`);
        setIsInitialized(false);
      };
    }
    
    // Mark as initializing
    initializationRef.current = true;
    if (typeof window !== 'undefined') {
      (window as any).__DOMO_MOUNTING_FLAG__ = true;
    }
    console.log(`🚀 [${componentId.current}] Starting Daily.co initialization`);
    
    // Create global initialization promise to prevent concurrent inits
    const initPromise = dailyCallSingleton.initialize(conversationUrl, onToolCall, componentId.current);
    if (typeof window !== 'undefined') {
      (window as any).__DOMO_INIT_PROMISE__ = initPromise;
    }
    
    // Initialize using singleton with component registration
    initPromise
      .then((call) => {
        if (call) {
          console.log(`✅ [${componentId.current}] Daily.co call initialized via singleton`);
          
          // Store ONLY in window (no module variables)
          if (typeof window !== 'undefined') {
            (window as any).__DOMO_DAILY_CALL_INSTANCE__ = call;
            (window as any).__DOMO_DAILY_CONTAINER__ = document.getElementById('daily-call-container');
            (window as any).__DOMO_COMPONENT_INITIALIZED__ = true;
            (window as any).__DOMO_CONVERSATION_URL__ = conversationUrl;
            (window as any).__DOMO_MOUNTING_FLAG__ = false;
          }
          
          setDailyCall(call);
          setIsInitialized(true);
          setIsConnected(true);
        }
        if (typeof window !== 'undefined') {
          (window as any).__DOMO_MOUNTING_FLAG__ = false;
          (window as any).__DOMO_INIT_PROMISE__ = null; // Clear global promise
        }
      })
      .catch((error) => {
        console.error(`❌ [${componentId.current}] Failed to initialize Daily.co:`, error);
        initializationRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__DOMO_MOUNTING_FLAG__ = false;
          (window as any).__DOMO_INIT_PROMISE__ = null; // Clear global promise
        }
      });

    // Cleanup function
    return () => {
      console.log(`🧹 [${componentId.current}] TavusConversation component unmounting`);
      // DON'T reset initializationRef if we have a browser-level instance
      if (!(typeof window !== 'undefined' && (window as any).__DOMO_DAILY_CALL_INSTANCE__)) {
        initializationRef.current = false;
      }
      if (typeof window !== 'undefined') {
        (window as any).__DOMO_MOUNTING_FLAG__ = false;
      }
      
      // Unregister this component from the singleton
      dailyCallSingleton.unregisterComponent(componentId.current);
      
      // Only clean up local state - DO NOT destroy global instance
      setDailyCall(null);
      setIsConnected(false);
      setIsInitialized(false);
      
      // Note: globalDailyCallInstance is intentionally preserved
    };
  }, [conversationUrl, onToolCall]);
  
  // Cleanup when conversation URL changes
  useEffect(() => {
    console.log(`🕒 [TavusConversation] useEffect at ${new Date().toISOString()}. URL=${conversationUrl}, mountFlag=${(typeof window !== 'undefined' ? (window as any).__DOMO_MOUNTING_FLAG__ : 'undefined')}, initPromise=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_INIT_PROMISE__ : 'undefined')}, dailyInstance=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_DAILY_CALL_INSTANCE__ : 'undefined')}, iframeMounted=${(typeof window !== 'undefined' ? !!(window as any).__DAILY_IFRAME_MOUNTED__ : 'undefined')}`);
    return () => {
      if (dailyCallSingleton.getConversationUrl() !== conversationUrl) {
        console.log(`🧹 [${componentId.current}] Cleaning up Daily.co call due to URL change`);
        dailyCallSingleton.cleanup();
      }
    };
  }, [conversationUrl]);
  
  // Global cleanup on window unload
  useEffect(() => {
    console.log(`🕒 [TavusConversation] useEffect at ${new Date().toISOString()}. URL=${conversationUrl}, mountFlag=${(typeof window !== 'undefined' ? (window as any).__DOMO_MOUNTING_FLAG__ : 'undefined')}, initPromise=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_INIT_PROMISE__ : 'undefined')}, dailyInstance=${(typeof window !== 'undefined' ? !!(window as any).__DOMO_DAILY_CALL_INSTANCE__ : 'undefined')}, iframeMounted=${(typeof window !== 'undefined' ? !!(window as any).__DAILY_IFRAME_MOUNTED__ : 'undefined')}`);
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

      {/* Status Indicators - Minimal overlay at bottom corners */}
      {isConnected && (
        <div className="absolute top-2 right-2 bg-green-100 border border-green-300 rounded-md px-2 py-1 z-10 max-w-xs">
          <p className="text-green-800 text-xs font-medium">✅ Connected</p>
        </div>
      )}
      
      {isMonitoring && (
        <div className="absolute bottom-2 left-2 bg-blue-100 border border-blue-300 rounded-md px-2 py-1 z-10 max-w-xs">
          <div className="flex justify-between items-center">
            <p className="text-blue-800 text-xs font-medium">🔍 Listening for real-time tool calls...</p>
            <button
              onClick={() => {
                console.log('Manual tool call test triggered');
                onToolCall('fetch_video', { video_name: 'Fourth Video' });
              }}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Test Tool Call
            </button>
            <button
              onClick={() => {
                console.log('🔥 FORCE RESET - Clearing ALL global state');
                
                // Reset ALL window flags
                
                // Reset window-level state
                if (typeof window !== 'undefined') {
                  (window as any).__DOMO_DAILY_CALL_INSTANCE__ = null;
                  (window as any).__DOMO_DAILY_CONTAINER__ = null;
                  (window as any).__DOMO_COMPONENT_INITIALIZED__ = false;
                  (window as any).__DOMO_CONVERSATION_URL__ = null;
                }
                
                // Cleanup singleton
                dailyCallSingleton.cleanup();
                
                console.log('✅ ALL global state cleared - ready for fresh initialization');
              }}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Force Cleanup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
