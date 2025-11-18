# Fix RLS Policies for Public Demo Access

## Problem
The `/demos/[demoId]/experience` page requires public (unauthenticated) access to work, but RLS policies are blocking anonymous users from viewing demos and videos.

## Root Cause
Current RLS policies only allow authenticated users to view their own demos:
```sql
CREATE POLICY "Users can view their own demos" ON public.demos
FOR SELECT USING (auth.uid() = user_id);
```

When `auth.uid()` is NULL (anonymous user), no rows are returned.

## Solution
Add public read-only policies that allow anyone to view demos and videos.

## Steps to Fix

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/xddjudwawavxwirpkksz

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Paste and Run this SQL:**

```sql
-- Allow public read access to demos
DROP POLICY IF EXISTS "Public can view published demos" ON public.demos;
CREATE POLICY "Public can view published demos"
  ON public.demos
  FOR SELECT
  USING (true);

-- Allow public read access to demo_videos
DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos;
CREATE POLICY "Public can view demo videos"
  ON public.demo_videos
  FOR SELECT
  USING (true);

-- Allow public read access to knowledge_chunks (needed for AI conversations)
DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Public can view knowledge chunks"
  ON public.knowledge_chunks
  FOR SELECT
  USING (true);
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify the Fix**

Run this command in your terminal:
```bash
node scripts/database/test-anon-access.js
```

You should now see:
```
✅ Demo found: WorkDay Platform Demo
Found 6 demos
Found 24 videos
```

### Option 2: Database Policies UI

1. Go to: **Database > Policies** in Supabase Dashboard

2. **For `demos` table:**
   - Click "New Policy"
   - Choose "For full customization"
   - Policy name: `Public can view published demos`
   - Allowed operation: `SELECT`
   - Policy definition: `true`
   - Click "Review" then "Save policy"

3. **Repeat for `demo_videos` table:**
   - Policy name: `Public can view demo videos`
   - Allowed operation: `SELECT`
   - Policy definition: `true`

4. **Repeat for `knowledge_chunks` table:**
   - Policy name: `Public can view knowledge chunks`
   - Allowed operation: `SELECT`
   - Policy definition: `true`

## Security Note

These policies allow **read-only** public access. Users still need to be authenticated to:
- Create demos (INSERT)
- Update demos (UPDATE)
- Delete demos (DELETE)

The existing RLS policies for these operations remain in place:
- `auth.uid() = user_id` for INSERT/UPDATE/DELETE

## After Applying

Your demo experience page should now work for anonymous visitors at:
```
/demos/8cc16f2d-b407-4895-9639-643d1a976da4/experience
```

## Verification

Test public access:
```bash
node scripts/database/test-anon-access.js
```

Expected output:
```
✅ Demo found: WorkDay Platform Demo
Found 6 demos
Found 24 videos
```
