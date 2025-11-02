# Deployment and Configuration Guide

This document provides comprehensive instructions for deploying and configuring the Domo AI MVP platform across different environments.

## Overview

The platform supports multiple deployment strategies:

- **Local Development**: Docker Compose with local Supabase
- **Staging Environment**: Render.com with cloud Supabase
- **Production Environment**: Vercel with cloud Supabase
- **Self-Hosted**: Custom infrastructure deployment

## Prerequisites

### Required Accounts and Services

1. **Supabase Account**: Database, authentication, and storage
2. **Tavus Account**: AI agent platform and API access
3. **ElevenLabs Account**: Audio transcription services
4. **OpenAI Account**: Vector embeddings generation
5. **Deployment Platform**: Vercel, Render, or custom hosting

### Required Tools

```bash
# Node.js and package manager
node --version  # v18.0.0 or higher
npm --version   # v8.0.0 or higher

# Supabase CLI
npm install -g supabase
supabase --version

# Git for version control
git --version

# Optional: Docker for local development
docker --version
docker-compose --version
```

## Environment Configuration

### Environment Variables

Create environment files for each deployment stage:

#### Development (.env.local)

```bash
# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SECRET_KEY=your_local_service_key

# External API Keys
TAVUS_API_KEY=your_tavus_api_key
TAVUS_BASE_URL=https://tavusapi.com/v2
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_URL=https://api.elevenlabs.io/v1
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Webhook Configuration (Development)
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
TAVUS_WEBHOOK_SECRET=your_webhook_secret
TAVUS_WEBHOOK_TOKEN=optional_url_token

# Feature Flags
TAVUS_TOOLS_ENABLED=true
TAVUS_MINIMAL_TOOLS=false
TAVUS_LLM_MODEL=tavus-llama-4
NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true

# Debug Settings
NEXT_PUBLIC_DEBUG_DAILY=true
NEXT_PUBLIC_E2E_TEST_MODE=false

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Staging (.env.staging)

```bash
# Supabase Configuration (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SECRET_KEY=your_staging_service_key

# External API Keys (Staging)
TAVUS_API_KEY=your_staging_tavus_api_key
ELEVENLABS_API_KEY=your_staging_elevenlabs_api_key
OPENAI_API_KEY=your_staging_openai_api_key

# Webhook Configuration (Staging)
NEXT_PUBLIC_BASE_URL=https://your-staging-app.onrender.com
TAVUS_WEBHOOK_SECRET=your_staging_webhook_secret

# Feature Flags
TAVUS_TOOLS_ENABLED=true
TAVUS_MINIMAL_TOOLS=false
NEXT_PUBLIC_DEBUG_DAILY=false
NEXT_PUBLIC_E2E_TEST_MODE=false

# Monitoring
SENTRY_DSN=your_staging_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_staging_sentry_dsn
```

#### Production (.env.production)

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SECRET_KEY=your_production_service_key

# External API Keys (Production)
TAVUS_API_KEY=your_production_tavus_api_key
ELEVENLABS_API_KEY=your_production_elevenlabs_api_key
OPENAI_API_KEY=your_production_openai_api_key

# Webhook Configuration (Production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
TAVUS_WEBHOOK_SECRET=your_production_webhook_secret

# Feature Flags (Production)
TAVUS_TOOLS_ENABLED=true
TAVUS_MINIMAL_TOOLS=false
NEXT_PUBLIC_DEBUG_DAILY=false
NEXT_PUBLIC_E2E_TEST_MODE=false

# Monitoring (Production)
SENTRY_DSN=your_production_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_production_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Environment Variable Security

```bash
# Generate secure secrets
openssl rand -hex 32  # For webhook secrets
openssl rand -base64 32  # For tokens

# Validate environment variables
npm run validate-env
```

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/domo-ai-mvp.git
cd domo-ai-mvp
npm install
```

### 2. Supabase Local Setup

```bash
# Initialize Supabase
supabase init

# Start local Supabase services
supabase start

# Apply database migrations
supabase migration up

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your API keys
nano .env.local
```

### 4. Database Seeding

```bash
# Create test user
curl -X POST http://localhost:3000/api/auth/setup-test-user

# Setup Tavus guardrails (one-time)
npx tsx scripts/setup-guardrails.ts

# Setup custom objectives (optional)
npx tsx scripts/setup-objectives.ts
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Webhook Testing Setup

```bash
# Install ngrok globally
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Update .env.local with ngrok URL
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

## Supabase Cloud Setup

### 1. Create Supabase Project

1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Choose region (closest to your users)
4. Set strong database password
5. Wait for project initialization

### 2. Configure Database

```bash
# Link to cloud project
supabase link --project-ref your-project-ref

# Push local migrations to cloud
supabase db push

# Generate production types
supabase gen types typescript --project-id your-project-ref > src/types/supabase.ts
```

### 3. Configure Authentication

```sql
-- Enable email authentication
INSERT INTO auth.config (parameter, value)
VALUES ('SITE_URL', 'https://your-domain.com');

-- Configure email templates (optional)
UPDATE auth.config 
SET value = 'https://your-domain.com/auth/callback'
WHERE parameter = 'REDIRECT_URL';
```

### 4. Storage Configuration

```bash
# Create storage bucket via SQL or Dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('demo-videos', 'demo-videos', false, 104857600);

# Configure CORS for file uploads
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'demo-videos';
```

### 5. Row Level Security

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS if not already enabled
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
```

## Vercel Deployment

### 1. Vercel Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel init
```

### 2. Project Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SECRET_KEY": "@supabase_secret_key",
    "TAVUS_API_KEY": "@tavus_api_key",
    "ELEVENLABS_API_KEY": "@elevenlabs_api_key",
    "OPENAI_API_KEY": "@openai_api_key",
    "TAVUS_WEBHOOK_SECRET": "@tavus_webhook_secret"
  }
}
```

### 3. Environment Variables

```bash
# Add environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SECRET_KEY production
vercel env add TAVUS_API_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add OPENAI_API_KEY production
vercel env add TAVUS_WEBHOOK_SECRET production

# Or via Vercel Dashboard
# https://vercel.com/your-team/your-project/settings/environment-variables
```

### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Deploy preview (staging)
vercel
```

### 5. Custom Domain

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS
# Add CNAME record: your-domain.com -> cname.vercel-dns.com
```

## Render Deployment

### 1. Render Configuration

Create `render.yaml`:

```yaml
services:
  - type: web
    name: domo-ai-production
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: SUPABASE_SECRET_KEY
        sync: false
      - key: TAVUS_API_KEY
        sync: false
      - key: ELEVENLABS_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: TAVUS_WEBHOOK_SECRET
        sync: false
      - key: NEXT_PUBLIC_BASE_URL
        fromService:
          type: web
          name: domo-ai-production
          property: host
```

### 2. Deploy to Render

1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure environment variables
4. Deploy

### 3. Environment Variables

Set via Render Dashboard:
- Navigate to your service
- Go to Environment tab
- Add all required variables
- Redeploy service

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}
      - TAVUS_API_KEY=${TAVUS_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 3. Build and Deploy

```bash
# Build Docker image
docker build -t domo-ai-mvp .

# Run container
docker run -p 3000:3000 --env-file .env.production domo-ai-mvp

# Or use Docker Compose
docker-compose up -d
```

## SSL/TLS Configuration

### 1. Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### 1. Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
});
```

### 2. Application Logging

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

### 3. Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    services: {
      database: await checkDatabaseHealth(),
      tavus: await checkTavusHealth(),
      storage: await checkStorageHealth(),
    }
  };

  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');
  
  return Response.json(health, { 
    status: isHealthy ? 200 : 503 
  });
}
```

## Performance Optimization

### 1. Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
```

### 2. Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache<T>(key: string, value: T, ttl = 3600): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

### 3. Database Connection Pooling

```typescript
// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'domo-ai-mvp',
      },
    },
  }
);

export default supabase;
```

## Security Configuration

### 1. Content Security Policy

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.tavus.com https://api.elevenlabs.io https://api.openai.com;"
  );

  return response;
}
```

### 2. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});
```

### 3. API Key Validation

```typescript
// lib/auth.ts
export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKeys = process.env.API_KEYS?.split(',') || [];
  
  return validKeys.includes(apiKey || '');
}
```

## Backup and Recovery

### 1. Database Backups

```bash
# Manual backup
supabase db dump --file backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
supabase db dump --file "backups/backup_$DATE.sql"
gzip "backups/backup_$DATE.sql"

# Upload to cloud storage
aws s3 cp "backups/backup_$DATE.sql.gz" s3://your-backup-bucket/
```

### 2. File Storage Backups

```bash
# Backup Supabase Storage
supabase storage download --recursive demo-videos backups/storage/

# Sync to cloud storage
aws s3 sync backups/storage/ s3://your-backup-bucket/storage/
```

### 3. Recovery Procedures

```bash
# Restore database
supabase db reset
psql -h your-db-host -U postgres -d postgres < backup.sql

# Restore storage
supabase storage upload --recursive demo-videos backups/storage/
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### Environment Variable Issues

```bash
# Validate environment variables
npm run validate-env

# Check variable loading
console.log('Environment check:', {
  supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  tavusKey: !!process.env.TAVUS_API_KEY,
  elevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
});
```

#### Database Connection Issues

```sql
-- Check connection limits
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';
```

#### Webhook Issues

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/tavus/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test", "conversation_id": "test"}'

# Check webhook URL accessibility
curl -I https://your-domain.com/api/tavus/webhook
```

### Performance Issues

```bash
# Check bundle size
npm run analyze

# Monitor memory usage
node --inspect server.js

# Database query analysis
EXPLAIN ANALYZE SELECT * FROM demos WHERE user_id = 'user-id';
```

### Monitoring Commands

```bash
# Check application logs
tail -f logs/combined.log

# Monitor system resources
htop
df -h
free -m

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Maintenance

### Regular Tasks

```bash
# Update dependencies
npm audit
npm update

# Database maintenance
supabase migration up
VACUUM ANALYZE;

# SSL certificate renewal
certbot renew --dry-run

# Log rotation
logrotate /etc/logrotate.d/domo-ai-mvp
```

### Monitoring Checklist

- [ ] Application health endpoint responding
- [ ] Database connections within limits
- [ ] SSL certificate valid and not expiring
- [ ] Webhook endpoints accessible
- [ ] External API quotas not exceeded
- [ ] Error rates within acceptable limits
- [ ] Response times under thresholds
- [ ] Storage usage within limits

This comprehensive deployment guide covers all aspects of deploying and maintaining the Domo AI MVP platform across different environments and hosting providers.