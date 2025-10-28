#!/bin/bash

# Setup script for new developers
set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Domo AI MVP Setup${NC}"
echo -e "${BLUE}===================${NC}"

# Check Node.js version
echo -e "${YELLOW}🔍 Checking Node.js version...${NC}"
node_version=$(node -v | cut -d'v' -f2)
required_version="20.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo -e "${GREEN}✅ Node.js version $node_version is compatible${NC}"
else
    echo -e "${RED}❌ Node.js version $node_version is too old. Please install Node.js 20+${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Copy environment template
if [[ ! -f ".env.local" ]]; then
    echo -e "${YELLOW}📋 Creating .env.local from template...${NC}"
    cp .env.development .env.local
    echo -e "${GREEN}✅ Created .env.local - please update with your actual values${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Install global tools (optional)
echo -e "${YELLOW}🛠️  Installing recommended global tools...${NC}"
npm list -g @playwright/test >/dev/null 2>&1 || npx playwright install

# Run initial build
echo -e "${YELLOW}🔨 Running initial build...${NC}"
npm run build

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Update .env.local with your actual API keys"
echo -e "2. Run 'npm run dev' to start development server"
echo -e "3. Visit http://localhost:3000 to see the app"
echo -e "4. Read RENDER_SETUP.md for Render deployment setup"
echo -e "5. Read DEPLOYMENT_GUIDE.md for general deployment instructions"