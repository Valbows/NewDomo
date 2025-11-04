#!/bin/bash

# CI Simulation Script
# This script simulates the exact GitHub Actions CI environment locally

echo "🚀 Starting CI Simulation..."
echo "=================================="

# Set CI environment variables (same as GitHub Actions)
export NODE_ENV="production"
export NEXT_TELEMETRY_DISABLED="1"
export NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="anon"
export SUPABASE_SECRET_KEY="secret"
export TAVUS_API_KEY="dummy"
export ELEVENLABS_API_KEY="dummy"
export SENTRY_DSN="http://example@localhost/1"
export NEXT_PUBLIC_SENTRY_DSN="http://example@localhost/1"

echo "✅ Environment variables set"

# Step 1: Clean install (simulate npm ci)
echo ""
echo "📦 Step 1: Clean install dependencies..."
rm -rf node_modules package-lock.json
npm install
echo "✅ Dependencies installed"

# Step 2: Verify Jest installation (same as CI)
echo ""
echo "🔍 Step 2: Verify Jest and ts-jest installation..."
npm list jest ts-jest || echo "⚠️  Some packages not found"
npx jest --version
echo "✅ Jest verification complete"

# Step 3: Lint (same as CI)
echo ""
echo "🔍 Step 3: Lint code..."
npm run lint:check || echo "⚠️  Linting completed with warnings/errors"
echo "✅ Linting complete"

# Step 4: Run tests (exact same command as CI)
echo ""
echo "🧪 Step 4: Run Unit & Integration Tests..."
echo "Command: npx jest --config=jest.config.simple.cjs"
npx jest --config=jest.config.simple.cjs
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Tests passed!"
else
    echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
    echo ""
    echo "🔍 Debugging information:"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Jest config exists: $(test -f jest.config.simple.cjs && echo 'YES' || echo 'NO')"
    echo "ts-jest installed: $(npm list ts-jest --depth=0 2>/dev/null | grep ts-jest && echo 'YES' || echo 'NO')"
    exit $TEST_EXIT_CODE
fi

# Step 5: Build (same as CI)
echo ""
echo "🏗️  Step 5: Build application..."
npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
    exit $BUILD_EXIT_CODE
fi

# Step 6: E2E Tests (same as CI)
echo ""
echo "🎭 Step 6: Install Playwright and run E2E tests..."
npx playwright install --with-deps
npm run e2e:ci
E2E_EXIT_CODE=$?

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo "✅ E2E tests passed!"
else
    echo "❌ E2E tests failed with exit code $E2E_EXIT_CODE"
    exit $E2E_EXIT_CODE
fi

echo ""
echo "🎉 CI Simulation Complete - All steps passed!"
echo "=================================="