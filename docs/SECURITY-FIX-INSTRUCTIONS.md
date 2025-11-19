# CRITICAL SECURITY FIX - Manual Application Required

## Issue
The RLS policies on the `demos`, `demo_videos`, and `knowledge_chunks` tables allowed **public read access to ALL data**, exposing all users' demos to everyone (authenticated or not).

## What Was Wrong
```sql
CREATE POLICY "Public can view published demos"
  ON public.demos
  FOR SELECT
  USING (true);  -- ❌ Allowed EVERYONE to see ALL demos
```

## Fix Applied
Created migration: `supabase/migrations/20251119000001_remove_public_demo_access.sql`

This migration removes the overly permissive public policies.

## Manual Steps to Apply (Run in Supabase SQL Editor)

**Option 1: Copy/paste the migration file**
```bash
# Copy the contents of this file:
cat supabase/migrations/20251119000001_remove_public_demo_access.sql
```

Then paste into Supabase Dashboard → SQL Editor → New Query → Run

**Option 2: Run these SQL commands directly**
```sql
-- Remove public read policy for demos
DROP POLICY IF EXISTS "Public can view published demos" ON public.demos;

-- Remove public read policy for demo_videos
DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos;

-- Remove public read policy for knowledge_chunks
DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks;
```

## Verify the Fix

After applying, run this diagnostic script:
```bash
node scripts/database/check-rls-issue.js
```

**Before fix:**
```
❌ SECURITY BREACH: Unauthenticated users can see 6 demos!
```

**After fix:**
```
✅ SECURE: Unauthenticated users can see 0 demos
```

## Impact

### What Changes
- ❌ Users can NO LONGER see other users' demos in their dashboard
- ❌ Unauthenticated users can NO LONGER access any demo data
- ✅ Users can ONLY see their OWN demos
- ✅ Proper data isolation is restored

### What Breaks
- ⚠️ The `/demos/[demoId]/experience` page will require authentication
- ⚠️ Public demo sharing links will not work

### Future Solution (if you need public sharing)
Add an `is_public` boolean column to the demos table:
```sql
ALTER TABLE demos ADD COLUMN is_public BOOLEAN DEFAULT false;

CREATE POLICY "Public or owner can view demos" ON demos
  FOR SELECT
  USING (is_public = true OR user_id = auth.uid());
```

Then users can mark specific demos as public while keeping others private.

## Files Changed
- ❌ Deleted: `supabase/migrations/20251117000000_allow_public_demo_access.sql`
- ✅ Created: `supabase/migrations/20251119000001_remove_public_demo_access.sql`
- ✅ Created: `scripts/database/check-rls-issue.js` (diagnostic tool)

## Apply Now
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the SQL from `supabase/migrations/20251119000001_remove_public_demo_access.sql`
4. Paste and run it
5. Verify with `node scripts/database/check-rls-issue.js`

---

**Status:** ⏳ Waiting for manual application in Supabase
**Priority:** 🚨 CRITICAL - Apply immediately
