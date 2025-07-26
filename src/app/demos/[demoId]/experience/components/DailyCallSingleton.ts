// Singleton class to manage Daily.co call instances globally
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
    
    // If no more active components, cleanup after a delay
    if (this.activeComponents.size === 0) {
      setTimeout(() => {
        if (this.activeComponents.size === 0) {
          console.log('🧹 No active components, cleaning up Daily.co call');
          this.cleanup();
        }
      }, 1000);
    }
  }

  public async initialize(conversationUrl: string, onToolCall: (toolName: string, args: any) => void, componentId: string): Promise<any> {
    // Register this component
    this.registerComponent(componentId);
    
    // If currently cleaning up, wait for it to complete
    if (this.isCleaningUp) {
      console.log('⏳ Waiting for cleanup to complete before initializing');
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
      await this.cleanup();
    }

    // If already initializing, return the promise
    if (this.initializationPromise) {
      console.log(`⏳ [${componentId}] Waiting for existing initialization`);
      return this.initializationPromise;
    }

    console.log(`🚀 [${componentId}] Starting new Daily.co initialization`);
    this.conversationUrl = conversationUrl;
    this.initializationPromise = this.createDailyCall(conversationUrl, onToolCall);
    
    try {
      this.dailyCall = await this.initializationPromise;
      this.isInitialized = true;
      console.log(`✅ [${componentId}] Daily.co call initialized successfully`);
      return this.dailyCall;
    } catch (error) {
      this.initializationPromise = null;
      console.error(`❌ [${componentId}] Failed to initialize Daily.co:`, error);
      throw error;
    }
  }

  private async createDailyCall(conversationUrl: string, onToolCall: (toolName: string, args: any) => void): Promise<any> {
    // Load Daily.co SDK if not already loaded
    if (typeof window !== 'undefined' && !(window as any).DailyIframe) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@daily-co/daily-js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Daily.co SDK'));
        document.head.appendChild(script);
      });
    }

    const Daily = (window as any).DailyIframe;
    if (!Daily) {
      throw new Error('Daily.co SDK not loaded');
    }

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
      console.log('Event data:', event.data);
      
      const { data } = event;
      
      // Check for different tool call event formats
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        console.log('🎯 Real-time tool call detected:', data);
        
        const toolName = data.name || data.function?.name;
        const toolArgs = data.args || data.arguments;
        
        if (toolName === 'fetch_video') {
          console.log('🎬 Triggering real-time video fetch:', toolArgs);
          onToolCall(toolName, toolArgs);
        }
      }
      
      // Check for tool calls in transcript format
      if (data?.transcript) {
        console.log('📝 Checking transcript for tool calls:', data.transcript);
        const transcript = data.transcript;
        
        // Find assistant messages with tool calls
        const toolCallMessages = transcript.filter((msg: any) => 
          msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
        );
        
        if (toolCallMessages.length > 0) {
          const lastToolCall = toolCallMessages[toolCallMessages.length - 1];
          const toolCall = lastToolCall.tool_calls[0];
          
          if (toolCall.function?.name === 'fetch_video') {
            console.log('🎬 Found fetch_video in transcript:', toolCall.function);
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log('🎬 Triggering real-time video from transcript:', args);
              onToolCall('fetch_video', args);
            } catch (error) {
              console.error('Error parsing tool call arguments:', error);
            }
          }
        }
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
    
    const errorHandler = (error: any) => {
      console.error('🚨 Daily call error:', error);
    };
    
    call.on('left-meeting', leftHandler);
    call.on('error', errorHandler);
    this.eventListeners.set('left-meeting', leftHandler);
    this.eventListeners.set('error', errorHandler);
  }

  private mountIframe(call: any, conversationUrl: string) {
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
        console.log('✅ Daily.co iframe mounted successfully');
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
        console.log('✅ Fallback iframe created');
      }
    }, 1000);
  }

  public async cleanup() {
    if (this.isCleaningUp) {
      console.log('⚠️ Cleanup already in progress, skipping');
      return;
    }
    
    this.isCleaningUp = true;
    console.log('🧹 Cleaning up Daily.co call singleton');
    
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
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    
    this.dailyCall = null;
    this.conversationUrl = null;
    this.container = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.isCleaningUp = false;
    this.activeComponents.clear();
    
    console.log('✅ Cleanup completed');
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
