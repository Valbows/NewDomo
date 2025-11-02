# Render Setup Guide

## Quick Setup

### 1. Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file automatically

### 2. Configure Services

The `render.yaml` file defines two services:

#### Staging Service

- **Name**: `domo-ai-staging`
- **Branch**: `develop`
- **URL**: `https://domo-ai-staging.onrender.com`
- **Auto-deploy**: ✅ (on push to develop)

#### Production Service

- **Name**: `domo-ai-production`
- **Branch**: `main` (default)
- **URL**: `https://domo-ai-production.onrender.com`
- **Auto-deploy**: ✅ (on push to main)

### 3. Set Environment Variables

In Render dashboard, for each service, add these environment variables:

#### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xddjudwawavxwirpkksz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key

# Tavus
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_replica_id
COMPLETE_PERSONA_ID=your_persona_id
DOMO_AI_OBJECTIVES_ID=your_objectives_id
DOMO_AI_GUARDRAILS_ID=your_guardrails_id

# Webhooks (different for each environment)
TAVUS_WEBHOOK_SECRET=staging_webhook_secret  # or production_webhook_secret
TAVUS_WEBHOOK_TOKEN=staging_webhook_token    # or production_webhook_token
NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN=staging_webhook_token  # or production_webhook_token
```

#### Optional Variables

```bash
# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# ElevenLabs (if using)
ELEVENLABS_API_KEY=your_elevenlabs_key

# OpenAI (if using)
OPENAI_API_KEY=your_openai_key
```

### 4. Deploy

#### Staging Deployment

```bash
git checkout develop
git add .
git commit -m "Deploy to staging"
git push origin develop
```

#### Production Deployment

```bash
git checkout main
git merge develop  # or your feature branch
git push origin main
```

## Service Configuration Details

### Build Settings

- **Build Command**: `npm ci && npm run build:staging` (or `build:production`)
- **Start Command**: `npm run start:staging` (or `start:production`)
- **Node Version**: 20
- **Environment**: `production` (for both staging and production services)

### Auto-Deploy

- **Staging**: Deploys automatically when you push to `develop` branch
- **Production**: Deploys automatically when you push to `main` branch

### Health Checks

Render automatically monitors your service health on port 3000.

## Webhook Configuration

After deployment, update your Tavus webhook URLs:

### Staging

- Webhook URL: `https://domo-ai-staging.onrender.com/api/webhooks/tavus`

### Production

- Webhook URL: `https://domo-ai-production.onrender.com/api/webhooks/tavus`

## Monitoring

### Render Dashboard

- View logs in real-time
- Monitor service health and metrics
- Check deployment history

### Service URLs

- **Staging**: https://domo-ai-staging.onrender.com
- **Production**: https://domo-ai-production.onrender.com

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check that all required environment variables are set
   - Verify Node.js version compatibility (20+)
   - Check build logs in Render dashboard

2. **Service Won't Start**

   - Ensure `PORT` environment variable is not set (Render sets this automatically)
   - Check that start command is correct
   - Verify all dependencies are installed

3. **Environment Variables Not Loading**

   - Ensure variables are set in Render dashboard, not just in `.env` files
   - Check that variable names match exactly
   - Restart service after adding new variables

4. **Webhook Issues**
   - Verify webhook URLs are updated in Tavus dashboard
   - Check that webhook secrets match between Render and Tavus
   - Monitor webhook logs in Render dashboard

### Getting Help

- Check Render documentation: https://render.com/docs
- View service logs in Render dashboard
- Check GitHub Actions for CI/CD status
