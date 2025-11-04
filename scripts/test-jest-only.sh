#!/bin/bash

# Jest-Only Test Script
# Focus on debugging the Jest ts-jest issue

echo "🧪 Jest Configuration Test"
echo "=========================="

# Set production environment (like CI)
export NODE_ENV="production"

echo "📋 Current Jest setup:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

echo "📦 Checking Jest installation:"
npm list jest ts-jest @types/jest || echo "Some packages missing"
echo ""

echo "🔍 Jest version:"
npx jest --version
echo ""

echo "📁 Jest config files:"
ls -la jest.config*.cjs
echo ""

echo "🧪 Testing different Jest configurations:"

echo ""
echo "1️⃣  Testing jest.config.simple.cjs (current CI config):"
npx jest --config=jest.config.simple.cjs --testPathPatterns=__tests__/unit/ConfigurationHeader.test.tsx --verbose
SIMPLE_EXIT_CODE=$?

echo ""
echo "2️⃣  Testing jest.config.cjs (multi-project config):"
npx jest --config=jest.config.cjs --testPathPatterns=__tests__/unit/ConfigurationHeader.test.tsx --verbose
MULTI_EXIT_CODE=$?

echo ""
echo "3️⃣  Testing default Jest (no config):"
npx jest __tests__/unit/ConfigurationHeader.test.tsx --verbose
DEFAULT_EXIT_CODE=$?

echo ""
echo "📊 Results Summary:"
echo "Simple config: $([ $SIMPLE_EXIT_CODE -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Multi config:  $([ $MULTI_EXIT_CODE -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Default:       $([ $DEFAULT_EXIT_CODE -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"

if [ $SIMPLE_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Simple config works! This should work in CI."
else
    echo ""
    echo "❌ Simple config failed. Let's debug:"
    echo ""
    echo "🔍 Checking ts-jest installation:"
    find node_modules -name "ts-jest" -type d
    echo ""
    echo "🔍 Checking Jest transform setup:"
    cat jest.config.simple.cjs
fi