# Render Hybrid Setup Guide

## Current Setup (Option 3: Hybrid Approach)

You're using a hybrid approach where:
- ✅ **Existing services** are managed through Render dashboard
- 📋 **render.yaml** serves as a template for future services or recreation

## Quick Configuration Steps

### 1. Update Environment Files

Update these files with your actual Render service URLs:

**`.env.staging`**
```bash
# Replace with your actual staging service URL
NEXT_PUBLIC_BASE_URL=https://your-staging-service.onrender.com
```

**`.env.production`**
```bash
# Replace with your actual production service URL  
NEXT_PUBLIC_BASE_URL=https://your-production-service.onrender.com
```

### 2. Update Webhook URLs

In your Tavus dashboard, update webhook URLs to match your Render services:
- **Staging**: `https://your-staging-service.onrender.com/api/webhooks/tavus`
- **Production**: `https://your-production-service.onrender.com/api/webhooks/tavus`

### 3. Environment Variables in Render

Ensure these are set in your Render dashboard for each service:

```bash
# Core Variables
NEXT_PUBLIC_SUPABASE_URL=https://xddjudwawavxwirpkksz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_replica_id
COMPLETE_PERSONA_ID=your_persona_id
DOMO_AI_OBJECTIVES_ID=your_objectives_id
DOMO_AI_GUARDRAILS_ID=your_guardrails_id

# Environment-specific
TAVUS_WEBHOOK_SECRET=your_webhook_secret
TAVUS_WEBHOOK_TOKEN=your_webhook_token
NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN=your_webhook_token
NEXT_PUBLIC_BASE_URL=https://your-service.onrender.com
```

## Using render.yaml (Future)

The `render.yaml` file is ready for when you need to:
- **Recreate services** (if something goes wrong)
- **Create new environments** (like a demo environment)
- **Share infrastructure setup** with team members
- **Migrate to Infrastructure as Code** approach

### To use render.yaml:
1. Update service names in the file to match your preferences
2. Commit and push to GitHub
3. In Render dashboard, create new service and select "Use render.yaml"

## Current Workflow

### Development
```bash
npm run dev  # Local development
```

### Deployment
Your existing Render services should auto-deploy when you push to their configured branches.

### Testing Different Environments Locally
```bash
# Test with staging config
npm run dev:staging

# Test with production config  
npm run dev:production
```

## Benefits of This Approach

✅ **No disruption** to existing deployments  
✅ **Gradual migration** to Infrastructure as Code  
✅ **Template ready** for future services  
✅ **Environment consistency** through config files  
✅ **Easy local testing** of different environments  

## Next Steps

1. **Update URLs** in `.env.staging` and `.env.production`
2. **Test locally** with `npm run dev:staging` and `npm run dev:production`
3. **Update webhooks** in Tavus dashboard
4. **Consider migrating** to render.yaml when convenient