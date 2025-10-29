# Authentication-Related Handlers and Components Analysis

## API Handlers (Authentication-Related)

### 1. `/api/setup-test-user/` 
- **File**: `src/app/api/setup-test-user/route.ts`
- **Purpose**: Creates a test user using Supabase admin API
- **Business Logic**: User creation with predefined credentials
- **Auth Operations**: 
  - `supabase.auth.admin.createUser()`
  - Email confirmation bypass
- **Classification**: Auth Service - User Management

## UI Pages (Authentication-Related)

### 1. `/auth/sign-in/`
- **File**: `src/app/auth/sign-in/page.tsx`
- **Purpose**: User sign-in form with custom styling
- **Auth Operations**:
  - `supabase.auth.signInWithPassword()`
  - User state management via Zustand store
  - Redirect to dashboard on success
- **Classification**: Auth UI - Sign In

### 2. `/login/`
- **File**: `src/app/login/page.tsx`
- **Purpose**: Alternative login page with different styling
- **Auth Operations**:
  - `supabase.auth.signInWithPassword()`
  - Redirect to homepage on success
- **Classification**: Auth UI - Login (Duplicate functionality)

### 3. `/signup/`
- **File**: `src/app/signup/page.tsx`
- **Purpose**: User registration form
- **Auth Operations**:
  - `supabase.auth.signUp()`
  - Email confirmation flow
- **Classification**: Auth UI - Registration

### 4. `/test-login/`
- **File**: `src/app/test-login/page.tsx`
- **Purpose**: Automated login for testing with hardcoded credentials
- **Auth Operations**:
  - `supabase.auth.signInWithPassword()` with test credentials
  - Redirect to demos/create
- **Classification**: Auth UI - Testing/Development

## Components (Authentication-Related)

### 1. AuthProvider
- **File**: `src/components/AuthProvider.tsx`
- **Purpose**: Global authentication state management
- **Auth Operations**:
  - Session initialization
  - Auth state change listening
  - E2E test mode bypass
- **Classification**: Auth Component - Provider

### 2. withAuth HOC
- **File**: `src/components/withAuth.tsx`
- **Purpose**: Higher-order component for route protection
- **Auth Operations**:
  - Authentication check
  - Redirect to sign-in if not authenticated
- **Classification**: Auth Component - Route Protection

## State Management (Authentication-Related)

### 1. User Store
- **File**: `src/store/user.ts`
- **Purpose**: Zustand store for user authentication state
- **Auth Operations**:
  - User state persistence
  - Login/logout actions
- **Classification**: Auth State - Store

## Business Logic Extraction Opportunities

### High Priority (Complex Business Logic)
1. **User Management Service** (from `setup-test-user`)
   - User creation logic
   - Test user management
   - Admin operations

2. **Authentication Service** (from UI pages)
   - Sign-in logic
   - Sign-up logic
   - Session management
   - Password reset (if implemented)

3. **Authorization Service** (from withAuth)
   - Route protection logic
   - Permission checking
   - Role-based access (if needed)

### Medium Priority (Utility Functions)
1. **Auth Utilities**
   - Session validation
   - Token management
   - Auth state helpers

## Recommended Service Structure

```
src/lib/services/auth/
├── index.ts                 # Main exports
├── user-management.ts       # User CRUD operations
├── authentication.ts        # Sign-in/sign-up logic
├── session.ts              # Session management
├── authorization.ts        # Route protection & permissions
└── types.ts                # Auth-related types
```

## API Routes to Reorganize

### Move to `/api/auth/`
1. `setup-test-user` → `auth/test-user`

### Potential New Auth Routes (if needed)
- `auth/sign-in` (API endpoint)
- `auth/sign-up` (API endpoint)
- `auth/sign-out` (API endpoint)
- `auth/session` (session validation)
- `auth/refresh` (token refresh)

## Duplicate Functionality Identified

1. **Duplicate Login Pages**: `/login/` and `/auth/sign-in/` serve similar purposes
2. **Inconsistent Redirects**: Different pages redirect to different locations after login

## Notes

- All auth operations currently use Supabase client directly
- No centralized auth service layer exists
- Auth state is managed via Zustand store
- E2E testing has special auth bypass logic
- Test credentials are hardcoded in multiple places