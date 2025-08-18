# Domo AI MVP - Interactive Demo Platform

A Next.js application that creates interactive AI-powered demos using Tavus Agent integration, Supabase backend, and ElevenLabs transcription services.

## Features

- 🎥 **Video Management**: Upload and manage demo video segments
- 🤖 **AI Agent Integration**: Tavus-powered conversational AI agents
- 📚 **Knowledge Base**: Upload documents and Q&A pairs for agent training
- 🎙️ **Auto Transcription**: ElevenLabs integration for video transcription
- 🔄 **Real-time Updates**: Supabase Realtime for live video playback
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 🎨 **Modern UI**: Beautiful interface with Tailwind CSS and Radix UI

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **AI Services**: Tavus API, ElevenLabs API
- **Database**: PostgreSQL with pgvector for embeddings
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ and npm
- Docker (for local Supabase)
- Supabase CLI
- API keys for Tavus and ElevenLabs

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Valbows/NewDomo.git
cd NewDomo
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

```env
# Supabase (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SECRET_KEY=your_local_service_key

# API Keys
TAVUS_API_KEY=your_tavus_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Tavus LLM model override (optional, default: tavus-llama-4)
TAVUS_LLM_MODEL=tavus-llama-4

# Sentry Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
# CI release token (set in CI/CD only)
SENTRY_AUTH_TOKEN=
```

### 3. Start Supabase Locally

```bash
supabase start
```

This will start all Supabase services locally and provide you with the local URLs and keys.

### 4. Apply Database Migrations

```bash
supabase migration up
```

### 5. Create Test User

```bash
curl -X POST http://localhost:3000/api/setup-test-user
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with:
- Email: `test@example.com`
- Password: `password`

## Usage

### Creating a Demo

1. **Log in** with your credentials
2. **Create a new demo** from the dashboard
3. **Upload video segments** that your AI agent will reference
4. **Add knowledge base content**:
   - Upload .txt documents
   - Add custom Q&A pairs
   - Video transcriptions are automatically added
5. **Configure your AI agent** with personality and settings
6. **Start a conversation** to test the interactive demo

### AI Agent Capabilities

The Tavus AI agent can:
- Answer questions about your demo content
- Play specific video segments on request
- Reference uploaded documents and Q&A pairs
- Maintain context throughout conversations

## Database Schema

### Core Tables

- `demos` - Demo projects and metadata
- `demo_videos` - Uploaded video segments
- `knowledge_chunks` - Knowledge base content with vector embeddings
- `users` - User authentication (managed by Supabase Auth)

### Key Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Vector Embeddings** - pgvector extension for semantic search
- **Real-time Subscriptions** - Live updates for video playback events

## API Endpoints

- `POST /api/create-agent` - Create Tavus persona for demo
- `POST /api/start-conversation` - Start Tavus conversation
- `POST /api/transcribe` - Process video transcription
- `POST /api/tavus-webhook` - Handle Tavus events
- `POST /api/setup-test-user` - Create test user (development only)

## Development

### Running Tests

```bash
npm test
```

### Database Management

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase migration up

# Reset database
supabase db reset
```

### Debugging

- Check browser console for frontend errors
- Monitor Supabase logs: `supabase logs`
- API endpoint logs are available in the terminal

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Update your `.env.local` with production Supabase URLs and API keys.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

**Video Upload Fails**
- Ensure Supabase storage bucket exists
- Check RLS policies allow user access
- Verify file size limits

**Agent Not Responding**
- Verify Tavus API key is correct
- Check webhook URL configuration
- Ensure persona is created successfully

**Transcription Not Working**
- Verify ElevenLabs API key
- Check video file format compatibility
- Monitor API rate limits

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Open a GitHub issue
- Check the troubleshooting section
- Review Supabase and Tavus documentation
