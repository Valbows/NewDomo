# Testing Organization Guide

## Overview

This document outlines the comprehensive testing strategy for the Domo AI project, including test organization, execution commands, and CI/CD integration.

## Test Directory Structure

```
__tests__/
├── unit/                          # Jest unit tests
├── integration/                   # Jest integration tests  
├── e2e/                          # CI-friendly E2E tests (mocked)
│   ├── .auth/                    # Authentication state
│   ├── mocks/                    # Mock data and interceptors
│   ├── basic-ci.spec.ts          # Basic functionality tests
│   ├── configure-page-mocked.spec.ts # Configure page with mocks
│   └── global.setup.ts           # Test setup
├── e2e-real/                     # Real API E2E tests
│   ├── video-controls-functionality-live.spec.ts
│   ├── video-overlay-success-live.spec.ts
│   ├── api-conversation-test.spec.ts
│   ├── dashboard-realtime.spec.ts
│   ├── demo-experience-button.spec.ts
│   ├── fresh-conversation-*.spec.ts
│   ├── pip-natural-end.spec.ts
│   ├── reporting-e2e.spec.ts
│   ├── simple-navigation.spec.ts
│   ├── tool-calling.spec.ts
│   ├── video-controls.spec.ts
│   └── global-setup.ts           # Real API setup
├── lib/                          # Test utilities and helpers
└── docs/                         # Test documentation
```

## Test Categories

### 1. Unit Tests (`__tests__/unit/`)
- **Purpose**: Test individual functions and components in isolation
- **Framework**: Jest with React Testing Library
- **Speed**: Very fast (< 1 second per test)
- **Dependencies**: None (fully mocked)
- **Coverage**: Component logic, utility functions, service methods

### 2. Integration Tests (`__tests__/integration/`)
- **Purpose**: Test component interactions and API integrations
- **Framework**: Jest with MSW for API mocking
- **Speed**: Fast (1-5 seconds per test)
- **Dependencies**: Mocked external APIs
- **Coverage**: Component integration, API workflows, data flow

### 3. CI E2E Tests (`__tests__/e2e/`)
- **Purpose**: Fast, reliable tests for CI/CD pipeline
- **Framework**: Playwright with comprehensive mocking
- **Speed**: Medium (5-15 seconds per test)
- **Dependencies**: Mocked APIs (Supabase, Tavus, etc.)
- **Coverage**: Critical user flows, page loads, navigation

### 4. Real E2E Tests (`__tests__/e2e-real/`)
- **Purpose**: Full integration testing with real APIs
- **Framework**: Playwright with live API connections
- **Speed**: Slow (15-60 seconds per test)
- **Dependencies**: Real Supabase, Tavus, ElevenLabs APIs
- **Coverage**: Complete user workflows, real data validation

## Test Execution Commands

### Development Testing
```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit                  # Unit tests only
npm run test:integration          # Integration tests only
npm run e2e:ci                    # CI E2E tests (mocked)
npm run e2e:real                  # Real API E2E tests

# Run tests in watch mode
npm run test:watch                # Jest tests
npm run test:unit:watch          # Unit tests watch
npm run test:integration:watch   # Integration tests watch

# Run specific test files
npm run test -- ConfigurationHeader.test.tsx
npm run e2e:real -- --grep "video overlay"
```

### CI/CD Pipeline
```bash
# GitHub Actions workflow
npm run test:ci                   # All Jest tests
npm run e2e:ci                   # CI-optimized E2E tests
```

### Manual Testing
```bash
# Real API testing (requires environment setup)
npm run e2e:real                 # All real E2E tests
npm run e2e:real:headed          # With browser UI
npm run e2e:real:debug           # Debug mode
```

## Test Configuration Files

### Jest Configuration
- **`jest.config.cjs`** - Main Jest configuration
- **`jest.config.dom.cjs`** - DOM environment for React components
- **`jest.config.node.cjs`** - Node.js environment for API tests
- **`jest.setup.js`** - Global Jest setup
- **`jest.setup.node.js`** - Node.js specific setup

### Playwright Configuration
- **`playwright.config.ts`** - Standard Playwright config (not used)
- **`playwright.ci.config.ts`** - CI-optimized config with mocking
- **`playwright.real.config.ts`** - Real API testing config

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
- name: Run Jest Tests
  run: npm run test:ci

- name: Run E2E Tests  
  run: npm run e2e:ci
```

### Test Results
- **Jest**: Coverage reports in `coverage/`
- **Playwright**: HTML reports in `test-artifacts/reports/`
- **Artifacts**: Screenshots, videos, traces in `test-artifacts/results/`

## Test Organization Principles

### 1. Speed-Based Separation
- **Fast Tests (CI)**: Unit, integration, mocked E2E
- **Slow Tests (Manual)**: Real API E2E tests
- **CI Pipeline**: Only runs fast, reliable tests

### 2. Dependency Management
- **No External Dependencies**: Unit and integration tests
- **Mocked Dependencies**: CI E2E tests
- **Real Dependencies**: Manual E2E tests

### 3. Environment Isolation
- **Development**: `.env.development` for local testing
- **CI**: Mocked environment variables
- **Real Testing**: Production-like environment setup

## Mock Strategy

### CI E2E Tests Mocking
```typescript
// Supabase API mocking
await page.route('**/rest/v1/demos**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockDemoData)
  });
});

// Tavus API mocking  
await page.route('**/tavus/videos**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockVideoData)
  });
});
```

### Benefits of Mocking
- **Reliability**: No external API failures
- **Speed**: No network latency
- **Consistency**: Predictable test data
- **Cost**: No API usage charges

## Test Data Management

### Mock Data Location
```
__tests__/e2e/mocks/
├── demo-data.ts              # Demo configuration data
├── video-data.ts             # Video showcase data
├── conversation-data.ts      # Conversation mock data
└── user-data.ts              # User authentication data
```

### Real Test Data
- **Database**: Uses real Supabase test database
- **APIs**: Connects to actual Tavus/ElevenLabs APIs
- **Cleanup**: Automated test data cleanup after runs

## Performance Metrics

### Current Test Performance
- **Unit Tests**: ~50 tests in 10 seconds
- **Integration Tests**: ~15 tests in 30 seconds  
- **CI E2E Tests**: 7 tests in 37 seconds
- **Real E2E Tests**: 13 tests in 5-10 minutes

### CI Pipeline Timing
- **Total CI Time**: ~2-3 minutes
- **Jest Tests**: ~40 seconds
- **E2E Tests**: ~37 seconds
- **Build & Deploy**: ~1-2 minutes

## Debugging and Troubleshooting

### Test Debugging Commands
```bash
# Debug specific tests
npm run test:debug ConfigurationHeader.test.tsx
npm run e2e:real:debug -- --grep "video overlay"

# View test reports
npx playwright show-report test-artifacts/reports
open coverage/lcov-report/index.html

# Check test artifacts
ls -la test-artifacts/results/
```

### Common Issues
1. **Flaky Tests**: Move to real E2E directory
2. **Slow CI**: Ensure proper mocking in CI tests
3. **API Failures**: Check environment variables
4. **Authentication**: Verify test user setup

## Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Clear test descriptions
2. **Single Responsibility**: One assertion per test
3. **Proper Cleanup**: Reset state after tests
4. **Error Handling**: Test both success and failure cases

### Mock Guidelines
1. **Realistic Data**: Use production-like mock data
2. **Edge Cases**: Include error scenarios in mocks
3. **Consistency**: Maintain mock data across tests
4. **Documentation**: Comment complex mock setups

### CI Optimization
1. **Fast Tests Only**: Keep CI tests under 1 minute total
2. **Parallel Execution**: Use multiple workers
3. **Selective Testing**: Only test critical paths in CI
4. **Artifact Management**: Clean up test artifacts

## Future Improvements

### Planned Enhancements
1. **Visual Regression Testing**: Screenshot comparisons
2. **Performance Testing**: Load and stress tests
3. **Accessibility Testing**: A11y compliance checks
4. **Cross-Browser Testing**: Multi-browser CI runs

### Monitoring and Metrics
1. **Test Coverage**: Maintain >80% coverage
2. **Flaky Test Detection**: Automated flaky test identification
3. **Performance Tracking**: Test execution time monitoring
4. **Success Rate Tracking**: CI pipeline reliability metrics

## Summary

This testing organization provides:
- **Fast CI Pipeline**: Reliable, mocked tests for quick feedback
- **Comprehensive Coverage**: Real API tests for thorough validation
- **Clear Separation**: Organized by speed and dependency requirements
- **Scalable Structure**: Easy to add new tests in appropriate categories
- **Developer Friendly**: Clear commands and documentation

The dual approach ensures both development velocity (fast CI) and deployment confidence (real API validation).