# ADR-005: Testing Strategy

## Status
Accepted

## Context
Tests were scattered across multiple directories (`src/__tests__`, `__tests__`, `src/tests`, `e2e`) with inconsistent patterns and coverage gaps, making it difficult to:
- Run comprehensive test suites
- Maintain test consistency
- Ensure adequate coverage
- Scale testing as the codebase grew

## Decision
We will implement a comprehensive testing strategy with unified organization and clear testing patterns.

### Test Organization
```
__tests__/                      # Unified test directory
├── unit/                       # Unit tests (mirror src structure)
│   ├── lib/                    # Service and utility tests
│   │   ├── services/           # Service layer tests
│   │   └── utils/              # Utility function tests
│   ├── components/             # Component tests
│   │   ├── ui/                 # UI component tests
│   │   └── features/           # Feature component tests
│   └── hooks/                  # Custom hook tests
├── integration/                # Integration tests
│   ├── api/                    # API endpoint tests
│   └── services/               # Service integration tests
└── e2e/                       # End-to-end tests
    ├── auth.spec.ts            # Authentication flows
    ├── demo-management.spec.ts # Demo creation and management
    └── conversation.spec.ts    # AI conversation flows
```

## Consequences

### Positive
- **Organization**: Clear separation of test types and purposes
- **Consistency**: Unified patterns across all tests
- **Coverage**: Comprehensive testing at all levels
- **Maintainability**: Easy to find and update tests
- **CI/CD**: Clear test execution strategies

### Negative
- **Complexity**: Multiple testing frameworks and patterns
- **Maintenance**: More test code to maintain
- **Performance**: Longer test execution times

## Testing Levels

### Unit Tests
**Purpose**: Test individual functions, components, and services in isolation

**Tools**: Jest, React Testing Library
**Coverage**: All service functions, utility functions, and React components

```typescript
// __tests__/unit/lib/services/auth/auth-service.test.ts
import { authService } from '@/lib/services/auth';
import { mockSupabaseClient } from '@/mocks/supabase';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      });

      const result = await authService.login(credentials);

      expect(result.user.email).toBe('test@example.com');
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Integration Tests
**Purpose**: Test interactions between multiple components, services, and external APIs

**Tools**: Jest, Supertest (for API testing)
**Coverage**: API endpoints, service interactions, database operations

```typescript
// __tests__/integration/api/demos.test.ts
import request from 'supertest';
import { app } from '@/app';
import { setupTestDatabase, cleanupTestDatabase } from '@/test-utils';

describe('/api/demos', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/demos', () => {
    it('should create a new demo for authenticated user', async () => {
      const demoData = {
        title: 'Test Demo',
        description: 'A test demo'
      };

      const response = await request(app)
        .post('/api/demos')
        .set('Authorization', 'Bearer valid-token')
        .send(demoData)
        .expect(201);

      expect(response.body.demo.title).toBe('Test Demo');
      expect(response.body.demo.userId).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const demoData = { title: 'Test Demo' };

      await request(app)
        .post('/api/demos')
        .send(demoData)
        .expect(401);
    });
  });
});
```

### End-to-End Tests
**Purpose**: Test complete user workflows from browser perspective

**Tools**: Playwright
**Coverage**: Critical user journeys, cross-browser compatibility

```typescript
// __tests__/e2e/demo-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Demo Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new demo', async ({ page }) => {
    // Navigate to demo creation
    await page.click('[data-testid=create-demo-button]');
    await expect(page).toHaveURL('/demos/create');

    // Fill demo form
    await page.fill('[data-testid=demo-title]', 'E2E Test Demo');
    await page.fill('[data-testid=demo-description]', 'Created by E2E test');

    // Submit form
    await page.click('[data-testid=submit-demo]');

    // Verify demo creation
    await expect(page).toHaveURL(/\/demos\/[a-z0-9-]+\/configure/);
    await expect(page.locator('[data-testid=demo-title]')).toContainText('E2E Test Demo');
  });

  test('should upload and process video', async ({ page }) => {
    // Navigate to existing demo
    await page.goto('/demos/test-demo-id/configure');

    // Upload video file
    const fileInput = page.locator('[data-testid=video-upload]');
    await fileInput.setInputFiles('test-fixtures/sample-video.mp4');

    // Wait for upload completion
    await expect(page.locator('[data-testid=upload-status]')).toContainText('Upload complete');

    // Verify video appears in list
    await expect(page.locator('[data-testid=video-list]')).toContainText('sample-video.mp4');
  });
});
```

## Testing Patterns

### Service Testing
- Mock external dependencies (Supabase, Tavus API)
- Test both success and error scenarios
- Validate input/output types and formats
- Test edge cases and boundary conditions

### Component Testing
- Test component rendering with different props
- Test user interactions and event handling
- Test accessibility and keyboard navigation
- Mock service dependencies

### API Testing
- Test authentication and authorization
- Test input validation and error handling
- Test response formats and status codes
- Test rate limiting and security measures

### E2E Testing
- Test critical user workflows end-to-end
- Test cross-browser compatibility
- Test responsive design and mobile experience
- Test performance and load times

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.{js,ts,tsx}',
    '<rootDir>/__tests__/integration/**/*.test.{js,ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Continuous Integration
- Run unit and integration tests on every commit
- Run E2E tests on pull requests
- Generate coverage reports and enforce thresholds
- Run tests across multiple Node.js versions
- Parallel test execution for faster feedback