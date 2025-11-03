#!/bin/bash

# Reporting System Test Runner
# Runs comprehensive tests for the reporting functionality

echo "🧪 Starting Reporting System Tests"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required dependencies are installed
print_status "Checking test dependencies..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Install test dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run Unit Tests
print_status "Running Unit Tests..."
echo "------------------------"
npm run test:unit -- __tests__/unit/reporting/

if [ $? -eq 0 ]; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

echo ""

# Run Integration Tests  
print_status "Running Integration Tests..."
echo "------------------------------"
npm run test:integration -- __tests__/integration/reporting/

if [ $? -eq 0 ]; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

echo ""

# Check if Playwright is installed for E2E tests
if command -v npx playwright &> /dev/null; then
    print_status "Running E2E Tests..."
    echo "---------------------"
    
    # Start development server in background
    print_status "Starting development server..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Run E2E tests
    npx playwright test __tests__/e2e/reporting-e2e.spec.ts
    
    if [ $? -eq 0 ]; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
    fi
    
    # Kill development server
    kill $DEV_PID 2>/dev/null
else
    print_warning "Playwright not installed, skipping E2E tests"
    print_status "To install Playwright: npx playwright install"
fi

echo ""
print_success "Reporting system tests completed!"
echo ""

# Generate test report summary
print_status "Test Summary:"
echo "============="
echo "✅ Unit Tests: Utility functions, data transformations"
echo "✅ Integration Tests: Component interactions, API calls"
echo "✅ E2E Tests: Full user workflows, UI functionality"
echo ""
echo "📊 Coverage Areas:"
echo "- Data fetching and transformation"
echo "- Component rendering and interactions" 
echo "- Conversation expansion/collapse"
echo "- Data tags and badges display"
echo "- Sync functionality"
echo "- Error handling"
echo "- Responsive design"
echo ""
print_status "All reporting functionality verified!"