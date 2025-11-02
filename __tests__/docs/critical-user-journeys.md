# Critical User Journeys - Expected Behavior Documentation

This document outlines the expected behavior for all critical user journeys in the application, serving as a reference for testing and validation.

## 1. Authentication Journey

### 1.1 User Sign-Up Flow
**Expected Behavior:**
- User provides email and password
- System validates email format and password strength
- Account is created in Supabase Auth
- User receives confirmation (if email confirmation enabled)
- User can sign in immediately (if email confirmation disabled)
- Session is established with access/refresh tokens

**Critical Success Criteria:**
- ✅ Valid email/password creates account
- ✅ Invalid data shows appropriate error messages
- ✅ Duplicate email registration is handled gracefully
- ✅ Session tokens are properly generated and stored

### 1.2 User Sign-In Flow
**Expected Behavior:**
- User provides email and password
- System validates credentials against Supabase Auth
- Valid credentials establish authenticated session
- Invalid credentials show clear error message
- Session includes user data and access tokens

**Critical Success Criteria:**
- ✅ Valid credentials grant access
- ✅ Invalid credentials are rejected with clear messaging
- ✅ Session data includes user ID, email, and tokens
- ✅ Session expiration is properly handled

### 1.3 Session Management
**Expected Behavior:**
- Active sessions are maintained across page refreshes
- Expired sessions trigger automatic refresh attempts
- Failed refresh attempts redirect to sign-in
- Sign-out clears all session data

**Critical Success Criteria:**
- ✅ Sessions persist across browser refreshes
- ✅ Token refresh works automatically
- ✅ Expired sessions are handled gracefully
- ✅ Sign-out completely clears authentication state

## 2. Demo Management Journey

### 2.1 Demo Creation Flow
**Expected Behavior:**
- Authenticated user can create new demo
- Demo requires name and optional objectives
- Demo is associated with user account
- Demo gets unique ID and default configuration
- User is redirected to demo configuration page

**Critical Success Criteria:**
- ✅ Demo creation requires authentication
- ✅ Demo name validation works correctly
- ✅ Demo is properly associated with user
- ✅ Default configuration is applied
- ✅ Navigation to configuration works

### 2.2 Demo Configuration Flow
**Expected Behavior:**
- User can access only their own demos
- Configuration includes CTA settings, objectives, and persona
- Changes are saved immediately or on explicit save
- Invalid configurations show validation errors
- Configuration affects agent behavior

**Critical Success Criteria:**
- ✅ Access control prevents unauthorized demo access
- ✅ Configuration changes are persisted
- ✅ Validation prevents invalid configurations
- ✅ CTA settings are properly stored and retrieved
- ✅ Objectives are correctly formatted and saved

### 2.3 Video Management Flow
**Expected Behavior:**
- Users can upload videos to their demos
- Videos are processed and stored securely
- Video metadata (title, transcript) is extracted
- Videos are available for agent tool calls
- Video access is restricted to demo owner

**Critical Success Criteria:**
- ✅ Video upload works for supported formats
- ✅ Video processing completes successfully
- ✅ Metadata extraction works correctly
- ✅ Video access control is enforced
- ✅ Videos appear in agent tool configurations

## 3. Agent Tool Calling Journey

### 3.1 Video Request Flow
**Expected Behavior:**
- Agent receives user request for video content
- Agent calls `fetch_video` tool with video title
- System looks up video in demo's video library
- System generates signed URL for video access
- System broadcasts video play event to frontend
- Frontend displays video in overlay interface

**Critical Success Criteria:**
- ✅ Tool call is properly parsed and validated
- ✅ Video lookup works by title matching
- ✅ Signed URLs are generated correctly
- ✅ Real-time broadcast reaches frontend
- ✅ Video overlay displays and plays correctly

### 3.2 CTA Display Flow
**Expected Behavior:**
- Agent determines appropriate time to show CTA
- Agent calls `show_trial_cta` tool
- System retrieves demo's CTA configuration
- System broadcasts CTA display event to frontend
- Frontend shows CTA banner with configured content
- CTA click tracking is recorded (if configured)

**Critical Success Criteria:**
- ✅ CTA tool call triggers display
- ✅ CTA content matches demo configuration
- ✅ CTA appears in correct UI location
- ✅ CTA interactions are tracked
- ✅ CTA can be dismissed by user

### 3.3 Video Controls Flow
**Expected Behavior:**
- User can pause, resume, and close videos
- Video controls work during agent conversation
- Closing video can trigger CTA display
- Multiple video requests work sequentially
- Video state is synchronized across UI

**Critical Success Criteria:**
- ✅ Pause/resume controls work correctly
- ✅ Close video removes overlay
- ✅ Video close can trigger CTA
- ✅ Sequential video requests work
- ✅ UI state remains consistent

## 4. Webhook Processing Journey

### 4.1 Webhook Authentication Flow
**Expected Behavior:**
- Incoming webhooks are verified for authenticity
- Signature verification uses shared secret
- Token-based verification (if configured) works
- Invalid webhooks are rejected with 401/403
- Valid webhooks proceed to processing

**Critical Success Criteria:**
- ✅ Signature verification works correctly
- ✅ Token verification (if enabled) works
- ✅ Invalid signatures are rejected
- ✅ Valid webhooks are processed
- ✅ Security logs are generated

### 4.2 Event Processing Flow
**Expected Behavior:**
- Webhook events are parsed and validated
- Event types are routed to appropriate handlers
- Tool call events trigger tool processing
- Conversation events update state
- Processing results are logged

**Critical Success Criteria:**
- ✅ Event parsing handles all supported types
- ✅ Tool calls are routed correctly
- ✅ Event validation catches malformed data
- ✅ Processing errors are handled gracefully
- ✅ Event processing is idempotent

### 4.3 Real-time Communication Flow
**Expected Behavior:**
- Processed events trigger real-time updates
- Frontend receives updates via Supabase channels
- UI updates reflect backend state changes
- Connection failures are handled gracefully
- Updates are delivered to correct demo instances

**Critical Success Criteria:**
- ✅ Real-time updates reach frontend
- ✅ Updates are delivered to correct channels
- ✅ Connection failures don't break functionality
- ✅ UI updates are applied correctly
- ✅ Multiple demo instances work independently

## 5. Error Handling and Edge Cases

### 5.1 Network Failure Scenarios
**Expected Behavior:**
- API failures show user-friendly error messages
- Retry mechanisms work for transient failures
- Offline state is handled gracefully
- Data loss is prevented during failures
- Recovery works when connection is restored

**Critical Success Criteria:**
- ✅ Network errors show appropriate messages
- ✅ Automatic retries work for safe operations
- ✅ User data is not lost during failures
- ✅ UI remains responsive during errors
- ✅ Recovery mechanisms work correctly

### 5.2 Invalid Data Scenarios
**Expected Behavior:**
- Invalid user input is validated and rejected
- Malformed API requests return clear errors
- Database constraint violations are handled
- Type mismatches are caught and reported
- Security violations are logged and blocked

**Critical Success Criteria:**
- ✅ Input validation works on frontend and backend
- ✅ Error messages are clear and actionable
- ✅ Security violations are properly blocked
- ✅ Data integrity is maintained
- ✅ Error logging captures sufficient detail

### 5.3 Performance Edge Cases
**Expected Behavior:**
- Large video files are handled efficiently
- High webhook volume doesn't cause failures
- Database queries remain performant
- UI remains responsive under load
- Resource limits are enforced

**Critical Success Criteria:**
- ✅ Video upload/processing handles large files
- ✅ Webhook processing scales with volume
- ✅ Database performance remains acceptable
- ✅ UI performance doesn't degrade
- ✅ Resource usage stays within limits

## 6. Security Requirements

### 6.1 Authentication Security
**Expected Behavior:**
- Passwords are properly hashed and stored
- Session tokens have appropriate expiration
- Token refresh works securely
- Brute force protection is in place
- Account lockout mechanisms work

**Critical Success Criteria:**
- ✅ Password security follows best practices
- ✅ Session management is secure
- ✅ Token handling prevents leakage
- ✅ Rate limiting prevents abuse
- ✅ Security logging captures threats

### 6.2 Authorization Security
**Expected Behavior:**
- Users can only access their own data
- API endpoints enforce proper authorization
- Cross-user data access is prevented
- Admin functions require proper privileges
- Resource access is properly scoped

**Critical Success Criteria:**
- ✅ Data access control works correctly
- ✅ API authorization is enforced
- ✅ Cross-user access is blocked
- ✅ Privilege escalation is prevented
- ✅ Resource scoping is maintained

### 6.3 Data Security
**Expected Behavior:**
- Sensitive data is encrypted at rest
- Data transmission uses HTTPS
- File uploads are scanned and validated
- Data retention policies are enforced
- Audit trails are maintained

**Critical Success Criteria:**
- ✅ Data encryption works correctly
- ✅ HTTPS is enforced everywhere
- ✅ File validation prevents malicious uploads
- ✅ Data retention is properly managed
- ✅ Audit logs capture security events

## Testing Strategy

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Focus on business logic validation
- Achieve high code coverage

### Integration Tests
- Test API endpoints end-to-end
- Test service layer interactions
- Test database operations
- Test webhook processing pipeline

### E2E Tests
- Test complete user workflows
- Test real browser interactions
- Test tool calling functionality
- Test error scenarios

### Performance Tests
- Test under expected load
- Test with large data sets
- Test webhook processing volume
- Test video upload/processing

This documentation serves as the definitive reference for expected system behavior and should be updated as features evolve.