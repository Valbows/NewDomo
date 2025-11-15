#!/bin/bash
# Comprehensive Test Runner Script
# Runs all types of tests: unit, integration, lib, and e2e
set -e  # Exit on any error

echo "🧪 Starting Comprehensive Test Suite..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_RESULT=0
INTEGRATION_RESULT=0
LIB_RESULT=0
E2E_RESULT=0

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "  1. Unit Tests (__tests__/unit/)"
echo "  2. Integration Tests (__tests__/integration/)"
echo "  3. Library Tests (__tests__/lib/)"
echo "  4. E2E Tests (Playwright)"
echo ""

# Function to run tests with error handling
run_test_suite() {
    local test_name=$1
    local test_command=$2
    local result_var=$3
    
    echo -e "${BLUE}🔄 Running ${test_name}...${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval $test_command; then
        echo -e "${GREEN}✅ ${test_name} PASSED${NC}"
        eval $result_var=0
    else
        echo -e "${RED}❌ ${test_name} FAILED${NC}"
        eval $result_var=1
    fi
    echo ""
}

# 1. Unit Tests
run_test_suite "Unit Tests" "npm run test:unit" "UNIT_RESULT"

# 2. Integration Tests  
run_test_suite "Integration Tests" "npm run test:integration" "INTEGRATION_RESULT"

# 3. Library Tests
run_test_suite "Library Tests" "npm run test:lib" "LIB_RESULT"

# 4. E2E Tests
run_test_suite "E2E Tests (Playwright)" "npm run e2e" "E2E_RESULT"

# Summary
echo "========================================"
echo -e "${BLUE}📋 Test Results Summary:${NC}"
echo "========================================"

if [ $UNIT_RESULT -eq 0 ]; then
    echo -e "Unit Tests:        ${GREEN}✅ PASSED${NC}"
else
    echo -e "Unit Tests:        ${RED}❌ FAILED${NC}"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "Integration Tests: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Integration Tests: ${RED}❌ FAILED${NC}"
fi

if [ $LIB_RESULT -eq 0 ]; then
    echo -e "Library Tests:     ${GREEN}✅ PASSED${NC}"
else
    echo -e "Library Tests:     ${RED}❌ FAILED${NC}"
fi

if [ $E2E_RESULT -eq 0 ]; then
    echo -e "E2E Tests:         ${GREEN}✅ PASSED${NC}"
else
    echo -e "E2E Tests:         ${RED}❌ FAILED${NC}"
fi

echo ""

# Overall result
TOTAL_FAILURES=$((UNIT_RESULT + INTEGRATION_RESULT + LIB_RESULT + E2E_RESULT))

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Your codebase is in excellent shape!${NC}"
    exit 0
else
    echo -e "${RED}💥 $TOTAL_FAILURES TEST SUITE(S) FAILED${NC}"
    echo -e "${YELLOW}Please review the failed tests above and fix any issues.${NC}"
    exit 1
fi