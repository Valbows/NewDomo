# Comprehensive Test Suite

This test suite ensures that the main branch functionality is preserved during refactoring. All tests should pass on the main branch before switching to the refactoring branch.

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for components and functions
│   ├── experience-page.test.tsx      # Demo experience page tests
│   └── reporting-component.test.tsx  # Reporting component tests
├── integration/             # Integration tests for APIs and services
│   └── api-endpoints.test.ts         # API endpoint integration tests
├── e2e/                     # End-to-end tests for complete user flows
│   ├── demo-experience-flow.spec.ts  # Complete demo experience flow
│   └── reporting-flow.spec.ts        # Reporting and analytics flow
└── README.md               # This file
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual components and functions in isolation
- **Coverage**: React components, utility functions, helper methods
- **Environment**: jsdom (simulated browser environment)
- **Run**: `npm run test:unit`

**Key Tests:**
- Demo Experience Page component rendering and state management
- Reporting component data display and Domo Score calculations
- Helper functions like conversation ID extraction
- Error handling and edge cases

### 2. Integration Tests
- **Purpose**: Test API endpoints and service integrations
- **Coverage**: API routes, database operations, external service calls
- **Environment**: Node.js
- **Run**: `npm run test:integration`

**Key Tests:**
- `/api/start-conversation` - Conversation creation
- `/api/track-video-view` - Video tracking
- `/api/track-cta-click` - CTA tracking
- `/api/sync-tavus-conversations` - Data synchronization
- `/api/tavus-webhook` - Webhook processing

### 3. End-to-End Tests
- **Purpose**: Test complete user workflows
- **Coverage**: Full user journeys from start to finish
- **Environment**: Real browser (Playwright)
- **Run**: `npm run e2e` (requires running dev server)

**Key Tests:**
- Complete demo experience flow (conversation → video → CTA)
- Reporting dashboard functionality
- Data capture and Domo Score calculation
- Error handling and recovery

## Running Tests

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only (requires dev server)
npm run e2e

# All Jest tests with coverage
npm run test:coverage
```

### Complete Test Suite
```bash
# Run all tests in sequence
npm run test:all
```

This will run:
1. Unit tests with coverage
2. Integration tests
3. Code quality checks (lint, type check)
4. Build verification
5. E2E tests (if dev server is running)

### For E2E Tests
E2E tests require a running development server:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run e2e
```

## Test Data and Mocking

### Unit Tests
- Mock Supabase client and API responses
- Mock Next.js navigation hooks
- Mock external components (CVI, video player)
- Use React Testing Library for component testing

### Integration Tests
- Mock external API calls (Tavus, Supabase)
- Use node-mocks-http for request/response mocking
- Test actual API route handlers
- Verify database operations

### E2E Tests
- Mock all external API responses
- Use Playwright for browser automation
- Test complete user workflows
- Verify UI interactions and state changes

## Key Functionality Tested

### Demo Experience Flow
- ✅ Page loading and initialization
- ✅ Conversation start and management
- ✅ Video fetching and playback
- ✅ Tool call handling (fetch_video)
- ✅ Objective completion processing
- ✅ CTA display and tracking
- ✅ Error handling and recovery
- ✅ State management and transitions

### Reporting and Analytics
- ✅ Data fetching from multiple tables
- ✅ Conversation list display
- ✅ Domo Score calculation (5-point system)
- ✅ Contact information display
- ✅ Product interest tracking
- ✅ Video showcase analytics
- ✅ CTA execution tracking
- ✅ Perception analysis display
- ✅ Transcript rendering
- ✅ Sync functionality
- ✅ Empty states and error handling

### API Endpoints
- ✅ Conversation creation and management
- ✅ Video view tracking
- ✅ CTA click tracking
- ✅ Webhook processing
- ✅ Data synchronization
- ✅ Error handling and validation

## Domo Score Testing

The Domo Score is a critical 5-point system that measures conversation quality:

1. **Contact Confirmation** - Name, email, position captured
2. **Reason for Visit** - Primary interest and pain points identified
3. **Platform Feature Interest** - Videos requested and shown
4. **CTA Execution** - Call-to-action clicked
5. **Visual Analysis** - Valid perception analysis available

**Test Coverage:**
- ✅ Perfect score (5/5) calculation
- ✅ Partial score scenarios
- ✅ Missing data handling
- ✅ Score breakdown display
- ✅ Average score calculation
- ✅ Credibility percentage

## Refactoring Validation

When switching to the refactoring branch:

1. **Run the same test suite**: `npm run test:all`
2. **All tests must pass** with identical results
3. **Any failures indicate** logic or functionality changes
4. **Fix refactoring branch** to match main branch behavior

## Test Maintenance

### Adding New Tests
- Follow existing patterns and structure
- Add tests for new functionality
- Maintain comprehensive coverage
- Update this README when adding new test categories

### Updating Tests
- Keep tests in sync with functionality changes
- Update mocks when API contracts change
- Maintain test data consistency
- Ensure tests remain fast and reliable

## Troubleshooting

### Common Issues
- **E2E tests fail**: Ensure dev server is running on port 3000
- **API tests fail**: Check environment variables and mocks
- **Component tests fail**: Verify React Testing Library setup
- **Build fails**: Check TypeScript errors and dependencies

### Debug Commands
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- experience-page.test.tsx

# Run tests with verbose output
npm test -- --verbose

# Debug E2E tests
npm run e2e -- --debug
```

This comprehensive test suite ensures that the main branch functionality is fully validated and can be safely refactored while maintaining identical behavior.