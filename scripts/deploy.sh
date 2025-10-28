#!/bin/bash

# Deployment script for Domo AI MVP
set -e

ENVIRONMENT=${1:-staging}
VALID_ENVIRONMENTS=("development" "staging" "production")

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Domo AI Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

# Validate environment
if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
    echo -e "${YELLOW}Valid environments: ${VALID_ENVIRONMENTS[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Deploying to: ${ENVIRONMENT}${NC}"

# Check if environment file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Environment file not found: ${ENV_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found: ${ENV_FILE}${NC}"

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed.${NC}" >&2; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo -e "${RED}❌ Vercel CLI is required but not installed. Run: npm i -g vercel${NC}" >&2; exit 1; }

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run lint
npm test

# Build application
echo -e "${YELLOW}🔨 Building application for ${ENVIRONMENT}...${NC}"
if [[ "$ENVIRONMENT" == "development" ]]; then
    npm run build
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    npm run build:staging
elif [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build:production
fi

# Deploy based on environment
case $ENVIRONMENT in
    "development")
        echo -e "${YELLOW}🏠 Starting development server...${NC}"
        npm run dev
        ;;
    "staging")
        echo -e "${YELLOW}🧪 Deploying to staging...${NC}"
        echo -e "${BLUE}📋 To deploy to staging:${NC}"
        echo -e "1. Push your changes to the 'develop' branch"
        echo -e "2. Render will automatically deploy from the develop branch"
        echo -e "${BLUE}🌐 Staging URL: https://domo-ai-staging.onrender.com${NC}"
        ;;
    "production")
        echo -e "${YELLOW}🚀 Deploying to production...${NC}"
        read -p "Are you sure you want to deploy to PRODUCTION? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}📋 To deploy to production:${NC}"
            echo -e "1. Push your changes to the 'main' branch"
            echo -e "2. Render will automatically deploy from the main branch"
            echo -e "${GREEN}✅ Ready for production deployment!${NC}"
            echo -e "${BLUE}🌐 Production URL: https://domo-ai-production.onrender.com${NC}"
        else
            echo -e "${YELLOW}⏸️  Production deployment cancelled.${NC}"
            exit 0
        fi
        ;;
esac

echo -e "${GREEN}🎉 Deployment process completed successfully!${NC}"