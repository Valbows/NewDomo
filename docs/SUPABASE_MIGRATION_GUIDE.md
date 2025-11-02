# 🚀 Supabase Project Migration Guide

## Current Status
- ✅ **Data exported** to `data-export.json`
- ✅ **Environment variables backed up** to `.env.backup`
- ✅ **Migration scripts created**

## Step-by-Step Migration Process

### Step 1: Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `domo-ai-mvp-fixed` (or similar)
   - **Database Password**: Choose a strong password
   - **Region**: Same as your old project (recommended)
5. Click **"Create new project"**
6. Wait for project creation (2-3 minutes)

### Step 2: Get New Project Credentials
1. In your new project dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Update Environment Variables
1. Open `.env.local` in your project
2. Replace the Supabase values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY

# Keep these the same
TAVUS_API_KEY=9e3a9a6a54e44edaa2e456191ba0d0f3
TAVUS_BASE_URL=https://tavusapi.com/v2
ELEVENLABS_API_KEY=sk_e73110b5df82e5e9a36eb4177274f3a62faa0b4cb1cbb34d
ELEVENLABS_URL=https://api.elevenlabs.io/v1
```

### Step 4: Set Up Database Schema
1. In your new Supabase project, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demos table
CREATE TABLE IF NOT EXISTS public.demos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  script TEXT,
  user_id UUID NOT NULL,
  video_url TEXT,
  video_storage_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  upload_id UUID DEFAULT uuid_generate_v4()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS demos_user_id_idx ON public.demos(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS demos_upload_id_idx ON public.demos(upload_id);

-- Enable RLS
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own demos" ON public.demos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demos" ON public.demos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demos" ON public.demos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own demos" ON public.demos
  FOR DELETE USING (auth.uid() = user_id);
```

4. Click **"Run"** to execute the SQL

### Step 5: Set Up Storage Policies
1. In the same SQL Editor, create a new query
2. Copy and paste this SQL:

```sql
-- Storage policies for demo-videos bucket
CREATE POLICY "Users can upload their own demo videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'demo-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own demo videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'demo-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own demo videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'demo-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own demo videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'demo-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

3. Click **"Run"** to execute the SQL

### Step 6: Run Setup Script
1. Open terminal in your project directory
2. Run the setup script:
```bash
node scripts/setup-new-project.js
```

This will:
- Create storage buckets
- Import your existing demo data
- Test storage functionality
- Verify everything is working

### Step 7: Test Upload Functionality
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/demos/create`
3. Try uploading a video file
4. **It should work without errors!** 🎉

## Rollback Plan (if needed)
If something goes wrong, you can restore your old project:
1. Copy values from `.env.backup` back to `.env.local`
2. Your old project data is still intact

## Expected Results
- ✅ **Fresh Supabase Storage** without JSON parsing errors
- ✅ **All your data migrated** (1 demo record)
- ✅ **Video uploads working** properly
- ✅ **Same functionality** as before

## Troubleshooting
If you encounter issues:
1. Check that all SQL commands ran successfully
2. Verify environment variables are correct
3. Ensure storage buckets were created
4. Check browser console for any remaining errors

---

**Ready to proceed?** Follow the steps above and your video upload issue should be completely resolved! 🚀
