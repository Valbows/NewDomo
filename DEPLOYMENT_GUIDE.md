# Deployment Guide

## Environment Overview

### 🏠 Local Development
- **URL**: `http://localhost:3000`
- **Environment**: `.env.local` or `.env.development`
- **Database**: Supabase Cloud (shared)
- **Webhooks**: Tunnel (localtunnel/ngrok)
- **Purpose**: Active development and testing

### 🧪 Staging
- **URL**: `https://your-staging-service.onrender.com` (update in `.env.staging`)
- **Environment**: `.env.staging`
- **Database**: Supabase Cloud (shared or separate staging project)
- **Webhooks**: Direct HTTPS
- **Branch**: Configured in your Render dashboard
- **Purpose**: Pre-production testing, client demos

### 🚀 Production
- **URL**: `https://your-production-service.onrender.com` (update in `.env.production`)
- **Environment**: `.env.production`
- **Database**: Supabase Cloud (production)
- **Webhooks**: Direct HTTPS
- **Branch**: Configured in your Render dashboard
- **Purpose**: Live application

## Quick Commands

### Local Development
```bash
# Standard development
npm run dev

# Test with staging config locally
npm run dev:staging
```

### Building
```bash
# Development build
npm run build

# Staging build
npm run build:staging

# Production build
npm run build:production
```

### Deployment

#### Render (Automatic)
Your existing Render services deploy automatically based on their configured branches:

```bash
# Deploy to staging (push to your configured staging branch)
git push origin your-staging-branch

# Deploy to production (push to your configured production branch)
git push origin your-production-branch
```

> **Note**: Check your Render dashboard to see which branches are configured for each service.

#### Docker (Local/Self-hosted)
```bash
# Build Docker image
npm run docker:build

# Run production container
npm run docker:run
```

## Environment Setup

### 1. Render Environment Variables

Set these in your Render dashboard for each service:

**Staging Service (domo-ai-staging):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `TAVUS_API_KEY`
- `TAVUS_REPLICA_ID`
- `COMPLETE_PERSONA_ID`
- `DOMO_AI_OBJECTIVES_ID`
- `DOMO_AI_GUARDRAILS_ID`
- `TAVUS_WEBHOOK_SECRET`
- `TAVUS_WEBHOOK_TOKEN`
- `NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN`
- `SENTRY_DSN` (optional)
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

**Production Service (domo-ai-production):**
- Same as staging but with production values

### 2. GitHub Secrets

For CI/CD notifications, set these in your GitHub repository secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `TAVUS_WEBHOOK_SECRET`

### 3. Supabase Setup

Consider creating separate Supabase projects for:
- **Development/Staging**: Current project (xddjudwawavxwirpkksz)
- **Production**: New dedicated production project

## Webhook Configuration

### Development
- Uses tunnel (localtunnel/ngrok)
- Webhook URL: `https://domo-kelvin-webhook.loca.lt/api/webhooks/tavus`

### Staging/Production
- Direct HTTPS webhooks
- Staging: `https://your-staging-service.onrender.com/api/webhooks/tavus`
- Production: `https://your-production-service.onrender.com/api/webhooks/tavus`

## Monitoring & Debugging

### Sentry Integration
- Configure separate Sentry projects for staging/production
- Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in environment variables

### Debug Flags
- `NEXT_PUBLIC_DEBUG_DAILY=true` (development only)
- `NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true` (all environments)

## Security Considerations

1. **Environment Separation**: Use different API keys and secrets for each environment
2. **Webhook Security**: Rotate webhook secrets regularly
3. **Database Access**: Consider separate Supabase projects for production
4. **Monitoring**: Enable Sentry for error tracking in production

## Troubleshooting

### Common Issues
1. **Webhook failures**: Check `NEXT_PUBLIC_BASE_URL` matches deployment URL
2. **Build failures**: Ensure all required environment variables are set
3. **Database connection**: Verify Supabase credentials and network access

### Logs
- **Render**: Check service logs in Render dashboard
- **Local**: Use `npm run dev` with debug flags enabled
- **Sentry**: Monitor errors and performance in Sentry dashboard