// Singleton class to manage Daily.co call instances globally
import { logError } from '@/lib/errors';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';
import DailyIframe from '@daily-co/daily-js';

class DailyCallSingleton {
  private static instance: DailyCallSingleton;
  private dailyCall: any = null;
  private conversationUrl: string | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<any> | null = null;
  private eventListeners = new Map();
  private isCleaningUp = false;
  private activeComponents = new Set<string>();

  private constructor() {}

  public static getInstance(): DailyCallSingleton {
    if (!DailyCallSingleton.instance) {
      DailyCallSingleton.instance = new DailyCallSingleton();
    }
    return DailyCallSingleton.instance;
  }

  public registerComponent(componentId: string): void {
    this.activeComponents.add(componentId);
    console.log(`📝 Registered component ${componentId}. Active components: ${this.activeComponents.size}`);
  }

  public unregisterComponent(componentId: string): void {
    this.activeComponents.delete(componentId);
    console.log(`🗑️ Unregistered component ${componentId}. Active components: ${this.activeComponents.size}`);
    
    // DISABLED: Don't auto-cleanup to prevent multiple instances
    // The cleanup will only happen on explicit cleanup() calls or URL changes
    console.log('🚫 Auto-cleanup disabled to prevent multiple Daily.co instances');
  }

  public async initialize(conversationUrl: string, onToolCall: (toolName: string, args: any) => void, componentId: string): Promise<any> {
    // Register this component
    this.registerComponent(componentId);
    
    // If currently cleaning up, wait for it to complete
    if (this.isCleaningUp) {
      console.log(`⏳ [${componentId}] Waiting for cleanup to complete before initializing`);
      await new Promise(resolve => {
        const checkCleanup = () => {
          if (!this.isCleaningUp) {
            resolve(undefined);
          } else {
            setTimeout(checkCleanup, 100);
          }
        };
        checkCleanup();
      });
    }
    
    // If already initialized for this conversation, return existing call
    if (this.dailyCall && this.conversationUrl === conversationUrl && this.isInitialized) {
      console.log(`🔄 [${componentId}] Reusing existing Daily.co call instance`);
      return this.dailyCall;
    }

    // If different conversation, cleanup first
    if (this.dailyCall && this.conversationUrl !== conversationUrl) {
      console.log(`🧹 [${componentId}] Different conversation detected, cleaning up first`);
      await this.cleanup();
    }

    // If already initializing for same conversation, return the promise
    if (this.initializationPromise && this.conversationUrl === conversationUrl) {
      console.log(`⏳ [${componentId}] Waiting for existing initialization`);
      return this.initializationPromise;
    }

    // Only initialize if we don't have an active call
    if (!this.dailyCall || !this.isInitialized) {
      console.log(`🚀 [${componentId}] Starting new Daily.co initialization`);
      this.conversationUrl = conversationUrl;
      this.initializationPromise = this.createDailyCall(conversationUrl, onToolCall);
      
      try {
        this.dailyCall = await this.initializationPromise;
        this.isInitialized = true;
        console.log(`✅ [${componentId}] Daily.co call initialized successfully`);
        return this.dailyCall;
      } catch (error: unknown) {
        this.initializationPromise = null;
        logError(error, `❌ [${componentId}] Failed to initialize Daily.co`);
        throw error;
      }
    } else {
      console.log(`🚫 [${componentId}] Daily.co call already exists, returning existing instance`);
      return this.dailyCall;
    }
  }

  private async createDailyCall(conversationUrl: string, onToolCall: (toolName: string, args: any) => void): Promise<any> {
    // Use bundled Daily.co SDK via npm import to avoid CDN version drift
    const Daily = DailyIframe;

    // Find container
    const container = document.getElementById('daily-call-container');
    if (!container) {
      throw new Error('Container not found for Daily.co iframe');
    }

    this.container = container;

    // Create Daily call instance
    const call = Daily.createCallObject({
      iframeStyle: {
        position: 'relative',
        width: '100%',
        height: '384px',
        border: '0',
        borderRadius: '8px'
      }
    });

    // Set up event listeners
    this.setupEventListeners(call, onToolCall);

    // Join the call
    await call.join({ url: conversationUrl });
    console.log('✅ Daily call joined successfully');

    // Mount iframe
    this.mountIframe(call, conversationUrl);

    return call;
  }

  private setupEventListeners(call: any, onToolCall: (toolName: string, args: any) => void) {
    // App message listener for tool calls
    const appMessageHandler = (event: any) => {
      console.log('=== DAILY APP MESSAGE RECEIVED ===');
      try {
        console.log('Full event (json):', JSON.stringify(event, null, 2));
      } catch {}
      const { data } = event || {};
      try {
        console.log('Event.data (json):', JSON.stringify(data, null, 2));
      } catch {}

      // Unified parsing using shared helper on multiple shapes
      let parsed = parseToolCallFromEvent(data);
      if (!parsed.toolName) parsed = parseToolCallFromEvent(event);

      console.log('Parsed tool call result (DailyCallSingleton):', parsed);

      const KNOWN_TOOLS = ['fetch_video', 'pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'];
      if (parsed.toolName && KNOWN_TOOLS.includes(parsed.toolName)) {
        if (parsed.toolName === 'fetch_video') {
          if (!parsed.toolArgs) {
            console.warn('fetch_video detected but args missing/null; ignoring');
            return;
          }
          console.log('🎬 Triggering real-time video fetch (parsed):', parsed.toolArgs);
          onToolCall('fetch_video', parsed.toolArgs);
          return;
        }
        // Forward all other supported tools (no-arg tools may provide null or {})
        const args = parsed.toolArgs ?? {};
        console.log(`➡️ Forwarding tool "${parsed.toolName}" to UI with args:`, args);
        onToolCall(parsed.toolName, args);
        return;
      }

      // Check for system events
      if (data?.message_type === 'system') {
        console.log('🔧 System event:', data);
      }
    };
    
    call.on('app-message', appMessageHandler);
    this.eventListeners.set('app-message', appMessageHandler);

    // Other event listeners
    const leftHandler = () => {
      console.log('❌ Daily call left');
    };
    
    const errorHandler = (error: unknown) => {
      logError(error, '🚨 Daily call error');
    };
    
    call.on('left-meeting', leftHandler);
    call.on('error', errorHandler);
    this.eventListeners.set('left-meeting', leftHandler);
    this.eventListeners.set('error', errorHandler);
  }

  private mountIframe(call: any, conversationUrl: string) {
    console.log(`🕒 [DailyCallSingleton] mountIframe invoked at ${new Date().toISOString()}. conversationUrl=${conversationUrl}, activeComponents=${this.activeComponents.size}, IFRAME_MOUNTED=${(window as any).__DAILY_IFRAME_MOUNTED__}, containerExists=${!!this.container}`);
    // Throttle: skip if iframe already globally mounted
    // Throttle: skip if iframe already globally mounted
    if (typeof window !== 'undefined' && (window as any).__DAILY_IFRAME_MOUNTED__) {
      console.log('⚠️ Global iframe mount flag set, skipping mountIframe');
      return;
    }
    setTimeout(() => {
      if (!this.container) {
        console.log('⚠️ No container available for iframe mounting');
        return;
      }
      
      // Check if iframe is already mounted
      const existingIframe = this.container.querySelector('iframe');
      if (existingIframe) {
        console.log('📺 Iframe already mounted, skipping');
        return;
      }
      
      // Clear container completely first
      this.container.innerHTML = '';
      
      const iframe = call.iframe();
      if (iframe) {
        // Style the iframe
        iframe.style.width = '100%';
        iframe.style.height = '384px';
        iframe.style.border = '0';
        iframe.style.borderRadius = '8px';
        iframe.style.display = 'block';
        
        // Append to container
        this.container.appendChild(iframe);
        console.log('✅ Daily.co iframe mounted successfully'); (window as any).__DAILY_IFRAME_MOUNTED__ = true;
      } else {
        console.log('🔄 Daily.co iframe not available, using fallback');
        const fallbackIframe = document.createElement('iframe');
        fallbackIframe.src = conversationUrl;
        fallbackIframe.style.width = '100%';
        fallbackIframe.style.height = '384px';
        fallbackIframe.style.border = '0';
        fallbackIframe.style.borderRadius = '8px';
        fallbackIframe.allow = 'camera; microphone; autoplay; display-capture';
        fallbackIframe.setAttribute('data-source', 'fallback');
        
        this.container.appendChild(fallbackIframe);
        console.log('✅ Fallback iframe created'); (window as any).__DAILY_IFRAME_MOUNTED__ = true;
      }
    }, 1000);
  }

  public async cleanup() {
    if (this.isCleaningUp) {
      console.log('⚠️ Cleanup already in progress, skipping');
      return;
    }
    
    this.isCleaningUp = true;
    console.log(`🧹 [DailyCallSingleton] Starting cleanup at ${new Date().toISOString()}. conversationUrl=${this.conversationUrl}, activeComponents=${this.activeComponents.size}, isInitialized=${this.isInitialized}`);
    
    if (this.dailyCall) {
      try {
        // Clean up event listeners
        this.eventListeners.forEach((handler, event) => {
          this.dailyCall.off(event, handler);
        });
        this.eventListeners.clear();
        
        await this.dailyCall.leave();
        this.dailyCall.destroy();
        
        // Clear container
        if (this.container) {
          this.container.innerHTML = '';
        }
      } catch (error: unknown) {
        logError(error, 'Error during cleanup');
      }
    }
    
    this.dailyCall = null;
    this.conversationUrl = null;
    this.container = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.isCleaningUp = false;
    this.activeComponents.clear();
    
    delete (window as any).__DAILY_IFRAME_MOUNTED__; console.log('✅ Cleanup completed');
  }

  public getDailyCall() {
    return this.dailyCall;
  }

  public isCallInitialized() {
    return this.isInitialized;
  }

  public getConversationUrl() {
    return this.conversationUrl;
  }
}

export default DailyCallSingleton;
