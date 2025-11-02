# API Integrations Documentation

This document provides comprehensive information about external API integrations used in the Domo AI MVP platform.

## Overview

The platform integrates with several external services to provide AI-powered conversational video experiences:

- **Supabase**: Database, authentication, storage, and real-time subscriptions
- **Tavus**: AI agent platform for conversational video interactions
- **ElevenLabs**: Audio transcription and voice processing
- **OpenAI**: Vector embeddings for semantic search
- **Daily.co**: WebRTC video communication infrastructure

## Supabase Integration

### Configuration

```typescript
// Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
```

### Services Used

#### Database (PostgreSQL)
- **Purpose**: Primary data storage for demos, videos, knowledge chunks, and user data
- **Extensions**: pgvector for vector embeddings
- **Security**: Row Level Security (RLS) policies for user data isolation

#### Authentication
- **Purpose**: User registration, login, and session management
- **Features**: JWT tokens, email/password authentication
- **Integration**: Automatic user context in API routes and components

#### Storage
- **Purpose**: Video file storage and management
- **Bucket**: `demo-videos` with 100MB file size limit
- **Security**: User-scoped access policies

#### Realtime
- **Purpose**: Live updates for demo data and conversation events
- **Tables**: `demos` table enabled for real-time subscriptions
- **Usage**: Video playback synchronization and status updates

### API Patterns

```typescript
// Database operations
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// User-scoped queries (RLS automatically applied)
const { data: demos } = await supabase
  .from('demos')
  .select('*')
  .eq('user_id', userId);

// Real-time subscriptions
const subscription = supabase
  .channel('demo-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'demos'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### Error Handling

```typescript
// Standard error handling pattern
const { data, error } = await supabase
  .from('demos')
  .insert(demoData);

if (error) {
  console.error('Database error:', error);
  throw new Error(`Failed to create demo: ${error.message}`);
}
```

## Tavus Integration

### Configuration

```typescript
// Environment Variables
TAVUS_API_KEY=your-tavus-api-key
TAVUS_BASE_URL=https://tavusapi.com/v2
TAVUS_REPLICA_ID=optional-default-replica-id
TAVUS_LLM_MODEL=tavus-llama-4
TAVUS_TOOLS_ENABLED=true
TAVUS_MINIMAL_TOOLS=false
TAVUS_WEBHOOK_SECRET=your-webhook-secret
TAVUS_WEBHOOK_TOKEN=optional-url-token
```

### Core Services

#### Persona Management
- **Purpose**: Create and configure AI agents for demos
- **Features**: Custom personalities, knowledge bases, behavioral guardrails
- **API Endpoints**: `/personas`, `/personas/{id}`

#### Conversation Management
- **Purpose**: Handle real-time AI conversations
- **Features**: WebRTC integration, tool calling, context management
- **API Endpoints**: `/conversations`, `/conversations/{id}`

#### Webhook Processing
- **Purpose**: Receive real-time events from Tavus platform
- **Events**: Conversation updates, tool calls, status changes
- **Security**: HMAC-SHA256 signature verification

### API Client Implementation

```typescript
// Tavus API Client
export class TavusClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: Partial<TavusApiConfig>) {
    this.apiKey = config?.apiKey || process.env.TAVUS_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://tavusapi.com/v2';
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<TavusApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    return {
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : undefined,
      status: response.status,
    };
  }
}
```

### Persona Creation

```typescript
// Create AI persona with knowledge base
const personaData = {
  persona_name: demo.name,
  system_prompt: `You are ${demo.agent_name}. ${demo.agent_personality}`,
  context: knowledgeBase,
  default_replica_id: process.env.TAVUS_REPLICA_ID,
  callback_url: webhookUrl,
  properties: {
    llm_model: process.env.TAVUS_LLM_MODEL || 'tavus-llama-4',
    tools: toolsEnabled ? toolDefinitions : undefined,
  }
};

const { data: persona } = await tavusClient.post('/personas', personaData);
```

### Tool Calling System

```typescript
// Tool definitions for AI agent capabilities
const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'fetch_video',
      description: 'Play a specific video segment',
      parameters: {
        type: 'object',
        properties: {
          video_title: {
            type: 'string',
            description: 'Title of the video to play'
          }
        },
        required: ['video_title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'display_cta',
      description: 'Show call-to-action button',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          url: { type: 'string' }
        }
      }
    }
  }
];
```

### Webhook Event Processing

```typescript
// Webhook event handler
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-tavus-signature');
  
  // Verify webhook authenticity
  const isValid = verifyWebhookSignature(rawBody, signature, process.env.TAVUS_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  
  // Process different event types
  switch (event.event_type) {
    case 'conversation.tool_called':
      await handleToolCall(event);
      break;
    case 'conversation.updated':
      await handleConversationUpdate(event);
      break;
  }

  return new Response('OK');
}
```

## ElevenLabs Integration

### Configuration

```typescript
// Environment Variables
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_URL=https://api.elevenlabs.io/v1
```

### Services Used

#### Speech-to-Text
- **Purpose**: Transcribe uploaded video files for knowledge base
- **Features**: Multi-language support, speaker identification
- **API Endpoint**: `/speech-to-text`

### API Implementation

```typescript
// ElevenLabs transcription service
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    this.baseUrl = process.env.ELEVENLABS_URL || 'https://api.elevenlabs.io/v1';
  }

  async transcribeVideo(audioBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('audio', new Blob([audioBuffer]), 'audio.mp3');

    const response = await fetch(`${this.baseUrl}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }
}
```

### Video Processing Workflow

```typescript
// Complete video processing pipeline
export async function processVideoTranscription(videoId: string) {
  // 1. Download video from Supabase Storage
  const { data: videoData } = await supabase.storage
    .from('demo-videos')
    .download(videoPath);

  // 2. Extract audio (using ffmpeg or similar)
  const audioBuffer = await extractAudio(videoData);

  // 3. Transcribe with ElevenLabs
  const transcript = await elevenLabsService.transcribeVideo(audioBuffer);

  // 4. Generate embeddings with OpenAI
  const embedding = await openAIService.createEmbedding(transcript);

  // 5. Store in knowledge base
  await supabase.from('knowledge_chunks').insert({
    demo_id: demoId,
    content: transcript,
    source: `Video: ${videoTitle}`,
    vector_embedding: embedding,
  });
}
```

## OpenAI Integration

### Configuration

```typescript
// Environment Variables
OPENAI_API_KEY=your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Services Used

#### Embeddings API
- **Purpose**: Generate vector embeddings for semantic search
- **Model**: text-embedding-3-small (1536 dimensions)
- **Usage**: Knowledge base content vectorization

### API Implementation

```typescript
// OpenAI embeddings service
export class OpenAIService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
  }
}
```

### Semantic Search Implementation

```typescript
// Vector similarity search
export async function searchKnowledgeBase(query: string, demoId: string, limit = 5) {
  // Generate query embedding
  const queryEmbedding = await openAIService.createEmbedding(query);

  // Search similar content using cosine similarity
  const { data: results } = await supabase.rpc('search_knowledge_chunks', {
    query_embedding: queryEmbedding,
    demo_id: demoId,
    match_threshold: 0.7,
    match_count: limit,
  });

  return results;
}
```

## Daily.co Integration

### Configuration

Daily.co integration is handled through Tavus, which provides Daily room URLs for WebRTC communication.

### WebRTC Connection

```typescript
// Daily.co room connection
import DailyIframe from '@daily-co/daily-js';

export class VideoCallService {
  private daily: DailyIframe | null = null;

  async joinCall(roomUrl: string) {
    this.daily = DailyIframe.createFrame({
      showLeaveButton: true,
      iframeStyle: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: 9999,
      },
    });

    await this.daily.join({ url: roomUrl });
  }

  async leaveCall() {
    if (this.daily) {
      await this.daily.leave();
      this.daily.destroy();
      this.daily = null;
    }
  }
}
```

## Error Handling and Monitoring

### Centralized Error Handling

```typescript
// API error handling middleware
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Known error types
    if (error.message.includes('TAVUS_API_KEY')) {
      return new Response('Tavus API configuration error', { status: 500 });
    }
    if (error.message.includes('SUPABASE')) {
      return new Response('Database error', { status: 500 });
    }
    
    return new Response(error.message, { status: 400 });
  }

  return new Response('Internal server error', { status: 500 });
}
```

### Monitoring and Logging

```typescript
// Sentry integration for error monitoring
import * as Sentry from '@sentry/nextjs';

// Configure Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Log API interactions
export function logApiCall(service: string, endpoint: string, duration: number) {
  console.log(`[${service}] ${endpoint} - ${duration}ms`);
  
  // Send to monitoring service
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${service} API call`,
    data: { endpoint, duration },
  });
}
```

## Rate Limiting and Quotas

### API Limits

- **Tavus**: 1000 requests/hour per API key
- **ElevenLabs**: 10,000 characters/month (free tier)
- **OpenAI**: $18/1M tokens for embeddings
- **Supabase**: 500MB database, 1GB bandwidth (free tier)

### Rate Limiting Implementation

```typescript
// Simple rate limiting for API routes
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimiter.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

## Security Considerations

### API Key Management
- Store all API keys in environment variables
- Use different keys for development and production
- Rotate keys regularly
- Never commit keys to version control

### Webhook Security
- Verify webhook signatures using HMAC-SHA256
- Use URL tokens as fallback authentication
- Validate payload structure and content
- Implement idempotency checks

### Data Privacy
- Implement Row Level Security (RLS) in Supabase
- Encrypt sensitive data at rest
- Use HTTPS for all API communications
- Audit log all data access

### Input Validation
- Validate all API inputs using TypeScript types
- Sanitize user-generated content
- Implement proper error handling
- Use CORS policies appropriately

## Testing API Integrations

### Unit Tests

```typescript
// Mock external API calls in tests
jest.mock('@/lib/services/tavus/tavus-client');

describe('TavusService', () => {
  it('should create persona successfully', async () => {
    const mockClient = jest.mocked(TavusClient);
    mockClient.prototype.post.mockResolvedValue({
      data: { persona_id: 'test-persona-id' },
      status: 200,
    });

    const result = await tavusService.createPersona(personaData);
    expect(result.persona_id).toBe('test-persona-id');
  });
});
```

### Integration Tests

```typescript
// Test actual API integrations with test data
describe('API Integration Tests', () => {
  it('should handle complete demo creation flow', async () => {
    // Create demo
    const demo = await demoService.createDemo(testUserId, demoData);
    
    // Create Tavus persona
    const persona = await tavusService.createPersona(demo);
    
    // Verify webhook URL is accessible
    const isAccessible = await webhookService.validateWebhookUrl();
    expect(isAccessible).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

#### Tavus API Errors
- **401 Unauthorized**: Check TAVUS_API_KEY configuration
- **Missing replica_id**: Set TAVUS_REPLICA_ID or ensure persona has default_replica_id
- **Webhook not receiving events**: Verify webhook URL accessibility and signature verification

#### Supabase Connection Issues
- **Connection timeout**: Check SUPABASE_URL and network connectivity
- **RLS policy errors**: Verify user authentication and policy configuration
- **Storage upload fails**: Check bucket policies and file size limits

#### ElevenLabs Transcription Issues
- **API quota exceeded**: Monitor usage and upgrade plan if needed
- **Unsupported file format**: Convert to supported audio formats
- **Transcription quality**: Ensure clear audio and appropriate language settings

### Debug Tools

```typescript
// API debugging utility
export function debugApiCall(service: string, request: any, response: any) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 ${service} API Debug`);
    console.log('Request:', request);
    console.log('Response:', response);
    console.groupEnd();
  }
}
```

## Performance Optimization

### Caching Strategies
- Cache Tavus persona data in database
- Use Redis for session data (if needed)
- Implement client-side caching for static data
- Cache OpenAI embeddings to avoid regeneration

### Async Processing
- Use background jobs for video transcription
- Implement webhook event queuing
- Process embeddings asynchronously
- Batch database operations where possible

### Connection Pooling
- Use Supabase connection pooling
- Implement HTTP client reuse
- Configure appropriate timeout values
- Monitor connection usage

This documentation provides a comprehensive overview of all external API integrations used in the Domo AI MVP platform. For specific implementation details, refer to the service layer code in `src/lib/services/`.