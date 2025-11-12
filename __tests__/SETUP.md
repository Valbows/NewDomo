# E2E Test Setup with Development Database

This guide explains how to run E2E tests using your development Supabase database.

## 🚀 Quick Setup

### 1. Use Your Development Database

Tests will run against your existing development Supabase project using `.env.development`.

### 2. Set Up Test Data (Optional)

If you want dedicated test data, you can run the setup script in your development database:

1. In your development project, go to **SQL Editor**
2. Copy and paste the contents of `scripts/setup-test-db.sql`
3. Click **Run** to create test data alongside your existing data

### 3. Environment Already Configured

Tests automatically use your `.env.development` file:

```bash
# .env.development (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

### 4. Verify Setup

Run the tests to verify everything works:

```bash
# Run all tests
npm run test:unit

# Run specific test to verify database connection
npm run test:unit -- --testNamePattern="renders the reporting component"
```

**Note**: Tests run against your development database, so you'll see real data in test results.

## 🔧 Test Data Management

### Automatic Test Data

The test suite automatically:
- ✅ Sets up fresh test data before all tests
- ✅ Cleans up test data after all tests
- ✅ Uses consistent test IDs for reliable testing

### Manual Test Data Reset

If you added test data and need to remove it:

```bash
# In your development Supabase project SQL Editor, run:
DELETE FROM cta_tracking WHERE demo_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM video_showcase_data WHERE conversation_id IN ('conv-1', 'conv-2');
DELETE FROM product_interest_data WHERE conversation_id IN ('conv-1', 'conv-2');
DELETE FROM qualification_data WHERE conversation_id IN ('conv-1', 'conv-2');
DELETE FROM conversation_details WHERE demo_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM demos WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**Warning**: Be careful not to delete your actual development data!

## 🎯 Test Data Structure

### Test Demo
- **ID**: `550e8400-e29b-41d4-a716-446655440000`
- **Name**: "Test Demo"
- **Tavus ID**: "test-conversation-id"

### Test Conversations
- **conv-1**: Complete conversation with all data
- **conv-2**: Active conversation with minimal data

### Related Data
- Contact info for conv-1 (John Doe)
- Product interest for conv-1 (Workforce Planning)
- Video showcase for conv-1 (2 videos)
- CTA tracking for conv-1 (clicked)

## 🔍 Troubleshooting

### Connection Issues
- ✅ Verify `.env.development` has correct URL and key
- ✅ Check development project is active in Supabase dashboard
- ✅ Ensure RLS policies allow test operations

### Test Failures
- ✅ Run database setup script again
- ✅ Check test data exists in Supabase dashboard
- ✅ Verify network connectivity

### Performance
- ✅ Tests may be slower than mocked tests (this is normal)
- ✅ Real database operations take time
- ✅ Consider increasing test timeouts if needed

## 🎉 Benefits of E2E Testing with Development Database

✅ **Real API Integration** - Tests actual Supabase queries against real data
✅ **No Mock Complexity** - No brittle mock setups to maintain
✅ **Reliable Results** - Tests real application behavior with real data
✅ **Refactoring Safety** - Validates actual functionality preservation
✅ **Database Schema Validation** - Catches schema issues early
✅ **Simple Setup** - Uses existing development environment

## 🔄 Perfect for Refactoring

This test setup is ideal for validating your refactoring work:

1. **Before refactoring**: Run `npm run test:unit` to establish baseline
2. **During refactoring**: Run tests frequently to catch regressions early
3. **After refactoring**: Run full test suite to verify functionality preserved

The tests will catch any breaking changes to:
- Database queries and data fetching
- Component rendering and UI behavior  
- Data flow and state management
- User interactions and event handling

## ✅ Current Status: Ready to Go!

Your E2E test setup is **complete and working**:
- ✅ Tests run against development database
- ✅ Core components (Experience Page & Reporting) tested
- ✅ Real Supabase API integration working
- ✅ Clean test data management
- ✅ No complex mocking required

**You're ready to start refactoring with confidence!** 🚀