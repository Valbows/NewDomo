# Webhook Documentation

This document provides comprehensive information about webhook processing in the Domo AI MVP platform.

## Overview

The platform uses webhooks to receive real-time events from external services, primarily Tavus AI platform. Webhooks enable real-time conversation updates, tool call processing, and analytics data collection.

## Webhook Architecture

### Core Components

```
External Service (Tavus) → Webhook Endpoint → Security Validation → Event Processing → Database Updates
                                    ↓
                            Tool Call Processing → UI Updates (Real-time)
```

### Service Layer Structure

- **WebhookProcessingService**: Main orchestrator for all webhook functionality
- **WebhookSecurityService**: Signature verification and authentication
- **WebhookEventProcessingService**: Event parsing and routing
- **WebhookToolCallService**: AI tool call processing and execution
- **WebhookDataIngestionService**: Data extraction and storage
- **WebhookValidationService**: Payload validation and sanitization

## Webhook Endpoints

### Primary Webhook Endpoint

```
POST /api/tavus/webhook
```

**Purpose**: Receive events from Tavus AI platform
**Authentication**: HMAC-SHA256 signature verification or URL token
**Content-Type**: application/json

### Webhook URL Configuration

```typescript
// Webhook URL generation
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const urlToken = process.env.TAVUS_WEBHOOK_TOKEN || '';
const webhookUrl = `${baseUrl}/api/tavus/webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;
```

### Environment Variables

```bash
# Webhook Security
TAVUS_WEBHOOK_SECRET=your-hmac-secret-key
TAVUS_WEBHOOK_TOKEN=optional-url-token-fallback

# Base URL (automatically set in production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Event Types

### Conversation Events

#### conversation.updated
Triggered when conversation status changes.

```json
{
  "event_type": "conversation.updated",
  "conversation_id": "conv_123456789",
  "persona_id": "persona_123456789",
  "status": "active",
  "participant_count": 2,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "metadata": {
    "demo_id": "demo_123456789",
    "user_id": "user_123456789"
  }
}
```

#### conversation.ended
Triggered when conversation terminates.

```json
{
  "event_type": "conversation.ended",
  "conversation_id": "conv_123456789",
  "persona_id": "persona_123456789",
  "duration_seconds": 300,
  "end_reason": "user_left",
  "ended_at": "2024-01-15T10:35:00Z",
  "analytics": {
    "total_messages": 15,
    "user_messages": 8,
    "agent_messages": 7,
    "tool_calls": 3
  }
}
```

### Tool Call Events

#### conversation.tool_called
Triggered when AI agent calls a tool function.

```json
{
  "event_type": "conversation.tool_called",
  "conversation_id": "conv_123456789",
  "persona_id": "persona_123456789",
  "tool_call": {
    "id": "call_123456789",
    "type": "function",
    "function": {
      "name": "fetch_video",
      "arguments": "{\"video_title\": \"Product Demo Overview\"}"
    }
  },
  "timestamp": "2024-01-15T10:32:00Z",
  "context": {
    "user_message": "Can you show me the product demo?",
    "conversation_turn": 5
  }
}
```

#### conversation.tool_result
Triggered after tool execution completes.

```json
{
  "event_type": "conversation.tool_result",
  "conversation_id": "conv_123456789",
  "tool_call_id": "call_123456789",
  "result": {
    "success": true,
    "video_id": "video_123456789",
    "video_url": "https://storage.supabase.co/...",
    "duration": 120
  },
  "execution_time_ms": 250
}
```

### Analytics Events

#### conversation.message
Triggered for each conversation message.

```json
{
  "event_type": "conversation.message",
  "conversation_id": "conv_123456789",
  "message": {
    "id": "msg_123456789",
    "role": "user",
    "content": "Tell me about your pricing",
    "timestamp": "2024-01-15T10:31:00Z"
  },
  "metadata": {
    "sentiment": "neutral",
    "intent": "pricing_inquiry",
    "confidence": 0.85
  }
}
```

## Security Implementation

### HMAC-SHA256 Signature Verification

```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace(/^sha256=/, '');
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cleanSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### URL Token Fallback

```typescript
export function verifyWebhookToken(
  tokenParam: string | null,
  tokenEnv: string | undefined
): boolean {
  if (!tokenParam || !tokenEnv) {
    return false;
  }

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(tokenParam, 'utf8'),
    Buffer.from(tokenEnv, 'utf8')
  );
}
```

### Security Headers Validation

```typescript
export function validateSecurityHeaders(headers: Record<string, string | null>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check Content-Type
  const contentType = headers['content-type'];
  if (!contentType?.includes('application/json')) {
    errors.push('Invalid Content-Type header');
  }

  // Check User-Agent (Tavus specific)
  const userAgent = headers['user-agent'];
  if (!userAgent?.includes('Tavus')) {
    errors.push('Invalid User-Agent header');
  }

  // Check for required headers
  const signature = headers['x-tavus-signature'] || headers['tavus-signature'];
  if (!signature && !process.env.TAVUS_WEBHOOK_TOKEN) {
    errors.push('Missing authentication (signature or token)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Event Processing

### Main Webhook Handler

```typescript
// /api/tavus/webhook/route.ts
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const url = new URL(request.url);
    const urlParams = url.searchParams;

    // Process webhook using service layer
    const webhookService = getWebhookProcessingService();
    const result = await webhookService.processWebhookRequest(
      rawBody,
      headers,
      urlParams
    );

    if (!result.success) {
      console.error('Webhook processing failed:', result.error);
      return new Response(result.error, { status: 400 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### Event Router

```typescript
export class WebhookEventProcessingService {
  async processEvent(
    event: WebhookEventData,
    supabase: SupabaseClient
  ): Promise<WebhookProcessingResult> {
    try {
      switch (event.event_type) {
        case 'conversation.updated':
          return await this.handleConversationUpdate(event, supabase);
        
        case 'conversation.ended':
          return await this.handleConversationEnd(event, supabase);
        
        case 'conversation.tool_called':
          return await this.handleToolCall(event, supabase);
        
        case 'conversation.tool_result':
          return await this.handleToolResult(event, supabase);
        
        case 'conversation.message':
          return await this.handleMessage(event, supabase);
        
        default:
          console.warn(`Unknown event type: ${event.event_type}`);
          return { success: true, processed: false };
      }
    } catch (error) {
      console.error('Event processing error:', error);
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }
}
```

## Tool Call Processing

### Supported Tools

#### fetch_video
Plays a specific video segment in the conversation interface.

```typescript
{
  "type": "function",
  "function": {
    "name": "fetch_video",
    "description": "Play a specific video segment based on title or content",
    "parameters": {
      "type": "object",
      "properties": {
        "video_title": {
          "type": "string",
          "description": "Title or description of the video to play"
        }
      },
      "required": ["video_title"]
    }
  }
}
```

#### display_cta
Shows a call-to-action button in the conversation interface.

```typescript
{
  "type": "function",
  "function": {
    "name": "display_cta",
    "description": "Display a call-to-action button with custom text and URL",
    "parameters": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "Button text to display"
        },
        "url": {
          "type": "string",
          "description": "URL to navigate to when clicked"
        }
      },
      "required": ["text", "url"]
    }
  }
}
```

### Tool Call Handler

```typescript
export class WebhookToolCallService {
  async processToolCall(
    event: WebhookEventData,
    supabase: SupabaseClient
  ): Promise<ToolCallResult> {
    const { toolName, toolArgs } = this.parseToolCall(event);

    switch (toolName) {
      case 'fetch_video':
        return await this.handleFetchVideo(toolArgs, event.conversation_id, supabase);
      
      case 'display_cta':
        return await this.handleDisplayCTA(toolArgs, event.conversation_id, supabase);
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  }

  private async handleFetchVideo(
    args: { video_title: string },
    conversationId: string,
    supabase: SupabaseClient
  ): Promise<ToolCallResult> {
    try {
      // Find matching video by title similarity
      const { data: videos } = await supabase
        .from('demo_videos')
        .select('*')
        .ilike('title', `%${args.video_title}%`)
        .limit(1);

      if (!videos || videos.length === 0) {
        return {
          success: false,
          error: `No video found matching: ${args.video_title}`
        };
      }

      const video = videos[0];

      // Store tool call result for real-time updates
      await supabase.from('processed_webhook_events').insert({
        conversation_id: conversationId,
        event_type: 'tool_call_result',
        event_data: {
          tool_name: 'fetch_video',
          result: {
            video_id: video.id,
            video_url: video.storage_url,
            title: video.title,
            duration: video.duration_seconds
          }
        },
        processed_at: new Date().toISOString()
      });

      return {
        success: true,
        result: {
          video_id: video.id,
          video_url: video.storage_url,
          title: video.title,
          duration: video.duration_seconds
        }
      };
    } catch (error) {
      console.error('Error handling fetch_video:', error);
      return {
        success: false,
        error: 'Failed to fetch video'
      };
    }
  }
}
```

## Real-time Updates

### Supabase Realtime Integration

```typescript
// Client-side real-time subscription
export function useWebhookEvents(conversationId: string) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`webhook-events-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processed_webhook_events',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newEvent = payload.new as WebhookEvent;
          setEvents(prev => [...prev, newEvent]);
          
          // Handle specific event types
          if (newEvent.event_type === 'tool_call_result') {
            handleToolCallResult(newEvent.event_data);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, supabase]);

  return events;
}
```

### Tool Call Result Handling

```typescript
// Handle tool call results in React component
function handleToolCallResult(eventData: any) {
  if (eventData.tool_name === 'fetch_video') {
    const { video_url, title } = eventData.result;
    
    // Update video player
    setCurrentVideo({
      url: video_url,
      title: title,
      autoplay: true
    });
    
    // Show notification
    toast.success(`Now playing: ${title}`);
  }
  
  if (eventData.tool_name === 'display_cta') {
    const { text, url } = eventData.result;
    
    // Show CTA button
    setCTAButton({
      text,
      url,
      visible: true
    });
  }
}
```

## Data Ingestion and Analytics

### Event Data Storage

```typescript
export class WebhookDataIngestionService {
  async processDataIngestion(
    event: WebhookEventData,
    conversationId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    try {
      // Store raw event for analytics
      await supabase.from('processed_webhook_events').insert({
        conversation_id: conversationId,
        event_type: event.event_type,
        event_data: event,
        processed_at: new Date().toISOString(),
        processing_duration_ms: Date.now() - this.startTime
      });

      // Extract analytics data
      if (event.event_type === 'conversation.message') {
        await this.processMessageAnalytics(event, supabase);
      }

      if (event.event_type === 'conversation.tool_called') {
        await this.processToolCallAnalytics(event, supabase);
      }

      if (event.event_type === 'conversation.ended') {
        await this.processConversationAnalytics(event, supabase);
      }
    } catch (error) {
      console.error('Data ingestion error:', error);
      // Don't throw - ingestion failures shouldn't break webhook processing
    }
  }

  private async processMessageAnalytics(
    event: WebhookEventData,
    supabase: SupabaseClient
  ): Promise<void> {
    const messageData = {
      conversation_id: event.conversation_id,
      message_id: event.message?.id,
      role: event.message?.role,
      content_length: event.message?.content?.length || 0,
      timestamp: event.message?.timestamp,
      sentiment: event.metadata?.sentiment,
      intent: event.metadata?.intent,
      confidence: event.metadata?.confidence
    };

    await supabase.from('conversation_messages').upsert(messageData);
  }
}
```

## Error Handling and Monitoring

### Idempotency Protection

```typescript
export async function checkIdempotency(
  event: WebhookEventData,
  rawBody: string,
  supabase: SupabaseClient
): Promise<{ isDuplicate: boolean; eventId?: string }> {
  // Generate event hash for deduplication
  const eventHash = crypto
    .createHash('sha256')
    .update(rawBody)
    .digest('hex');

  // Check if event already processed
  const { data: existingEvent } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_hash', eventHash)
    .single();

  if (existingEvent) {
    console.log(`Duplicate webhook event detected: ${eventHash}`);
    return { isDuplicate: true, eventId: existingEvent.id };
  }

  return { isDuplicate: false };
}
```

### Error Recovery

```typescript
export class WebhookErrorHandler {
  async handleProcessingError(
    error: Error,
    event: WebhookEventData,
    context: string
  ): Promise<void> {
    console.error(`Webhook processing error in ${context}:`, error);

    // Log error for monitoring
    await this.logError(error, event, context);

    // Attempt recovery for specific error types
    if (error.message.includes('database')) {
      await this.handleDatabaseError(event);
    }

    if (error.message.includes('tool_call')) {
      await this.handleToolCallError(event);
    }
  }

  private async logError(
    error: Error,
    event: WebhookEventData,
    context: string
  ): Promise<void> {
    // Send to monitoring service (Sentry, etc.)
    Sentry.captureException(error, {
      tags: {
        component: 'webhook',
        context,
        event_type: event.event_type
      },
      extra: {
        conversation_id: event.conversation_id,
        event_data: event
      }
    });
  }
}
```

## Testing Webhooks

### Local Development Setup

```bash
# Install ngrok for local webhook testing
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Update environment variable
export NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

### Webhook Testing Utility

```typescript
// Test webhook endpoint
export async function testWebhookEndpoint(webhookUrl: string): Promise<boolean> {
  try {
    const testEvent = {
      event_type: 'conversation.updated',
      conversation_id: 'test-conversation',
      persona_id: 'test-persona',
      status: 'active',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tavus-Webhook-Test'
      },
      body: JSON.stringify(testEvent)
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook test failed:', error);
    return false;
  }
}
```

### Mock Webhook Events

```typescript
// Generate mock events for testing
export function createMockWebhookEvent(
  type: string,
  overrides: Partial<WebhookEventData> = {}
): WebhookEventData {
  const baseEvent = {
    event_type: type,
    conversation_id: `conv_${Date.now()}`,
    persona_id: `persona_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...overrides
  };

  switch (type) {
    case 'conversation.tool_called':
      return {
        ...baseEvent,
        tool_call: {
          id: `call_${Date.now()}`,
          type: 'function',
          function: {
            name: 'fetch_video',
            arguments: '{"video_title": "Test Video"}'
          }
        }
      };
    
    default:
      return baseEvent;
  }
}
```

## Performance Optimization

### Async Processing

```typescript
// Process non-critical events asynchronously
export async function processWebhookAsync(event: WebhookEventData): Promise<void> {
  // Immediate response for critical events
  if (event.event_type === 'conversation.tool_called') {
    await processToolCallImmediate(event);
    return;
  }

  // Queue non-critical events for background processing
  await queueBackgroundProcessing(event);
}

async function queueBackgroundProcessing(event: WebhookEventData): Promise<void> {
  // Use a job queue (Redis, etc.) for production
  setTimeout(() => {
    processEventBackground(event);
  }, 0);
}
```

### Caching Strategies

```typescript
// Cache frequently accessed data
const videoCache = new Map<string, VideoData>();

export async function getCachedVideo(videoTitle: string): Promise<VideoData | null> {
  const cacheKey = videoTitle.toLowerCase();
  
  if (videoCache.has(cacheKey)) {
    return videoCache.get(cacheKey)!;
  }

  // Fetch from database
  const video = await fetchVideoFromDatabase(videoTitle);
  if (video) {
    videoCache.set(cacheKey, video);
  }

  return video;
}
```

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
1. Check webhook URL accessibility
2. Verify HTTPS configuration
3. Confirm Tavus persona callback_url setting
4. Test with ngrok for local development

#### Authentication Failures
1. Verify TAVUS_WEBHOOK_SECRET configuration
2. Check signature generation and verification
3. Ensure URL token is properly encoded
4. Validate request headers

#### Tool Call Processing Errors
1. Check video database records
2. Verify tool function definitions
3. Test tool argument parsing
4. Monitor real-time subscription status

### Debug Tools

```typescript
// Webhook debugging middleware
export function debugWebhook(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Webhook Debug');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('URL:', req.url);
    console.groupEnd();
  }
  next();
}
```

### Monitoring Dashboard

```typescript
// Webhook health check endpoint
export async function GET() {
  const stats = await getWebhookStats();
  
  return Response.json({
    status: 'healthy',
    webhook_url: getWebhookUrl(),
    last_24h: {
      total_events: stats.totalEvents,
      successful_events: stats.successfulEvents,
      failed_events: stats.failedEvents,
      tool_calls: stats.toolCalls
    },
    uptime: process.uptime()
  });
}
```

This comprehensive webhook documentation covers all aspects of webhook processing in the Domo AI MVP platform. For implementation details, refer to the webhook service layer code in `src/lib/services/webhooks/`.