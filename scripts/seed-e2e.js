#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing envs: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
  console.log('🚀 Seeding E2E user and demo...');

  const email = 'test@example.com';
  const password = 'password123'; // unified password to match Playwright spec
  const demoId = '42beb287-f385-4100-86a4-bfe7008d531b';

  // 1) Ensure user exists and has the unified password
  const list = await admin.auth.admin.listUsers();
  if (list.error) throw list.error;
  let user = list.data.users.find((u) => u.email === email);

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    user = created.data.user;
    console.log('✅ User created:', user.id);
  } else {
    const upd = await admin.auth.admin.updateUserById(user.id, { password });
    if (upd.error) {
      console.warn('⚠️  Could not update password (may already match):', upd.error.message || upd.error);
    } else {
      console.log('🔐 Password unified for user:', user.id);
    }
    console.log('✅ User exists:', user.id);
  }

  // 2) Ensure demo exists for this user
  const metadata = {
    uploadId: demoId,
    userId: user.id,
    fileName: 'live-e2e.json',
    fileType: 'application/json',
    fileSize: '1024',
    uploadTimestamp: new Date().toISOString(),
    agentName: 'E2E Agent',
    agentPersonality: 'Helpful',
    agentGreeting: 'Hello',
  };

  const sel = await admin.from('demos').select('id').eq('id', demoId).single();
  if (sel.data && sel.data.id) {
    const upd = await admin
      .from('demos')
      .update({ user_id: user.id, name: 'Live E2E Demo', video_storage_path: 'test-videos/', metadata })
      .eq('id', demoId);
    if (upd.error) throw upd.error;
    console.log('✅ Demo updated for test user');
  } else {
    const ins = await admin.from('demos').insert({
      id: demoId,
      name: 'Live E2E Demo',
      user_id: user.id,
      tavus_persona_id: null,
      video_storage_path: 'test-videos/',
      metadata,
    });
    if (ins.error) throw ins.error;
    console.log('✅ Demo inserted for test user');
  }

  console.log('🎉 Seed complete. You can now run: npm run e2e:real');
})().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
