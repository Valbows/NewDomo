require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const { TwelvelabsApiClient } = require('twelvelabs-js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const client = new TwelvelabsApiClient({ apiKey: process.env.TWELVE_LABS_API_KEY });
const INDEX_ID = '694b0659db0246c06ce17a04'; // Your existing index

// Create temp directory for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'twelvelabs-uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function downloadVideo(signedUrl, filename) {
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const filepath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

async function indexVideo(videoId) {
  // Get video from DB
  const { data: video, error } = await supabase
    .from('demo_videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    console.log('Video not found:', videoId);
    return null;
  }

  console.log('\n📹 Processing:', video.title);

  // Create signed URL
  const { data: signedUrl } = await supabase.storage
    .from('demo-videos')
    .createSignedUrl(video.storage_url, 3600);

  if (!signedUrl) {
    console.log('  ❌ Could not generate signed URL');
    return null;
  }

  // Download video to temp file
  const filename = `${videoId}.mp4`;
  console.log('  ⬇️  Downloading video...');

  let filepath;
  try {
    filepath = await downloadVideo(signedUrl.signedUrl, filename);
    const stats = fs.statSync(filepath);
    console.log(`  📁 Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.log('  ❌ Download error:', err.message);
    return null;
  }

  // Upload to Twelve Labs
  try {
    console.log('  ⬆️  Uploading to Twelve Labs...');

    const task = await client.tasks.create({
      indexId: INDEX_ID,
      videoFile: fs.createReadStream(filepath)
    });

    console.log('  ✅ Task created:', task.id);

    // Update DB with task info
    await supabase
      .from('demo_videos')
      .update({
        metadata: {
          ...video.metadata,
          twelvelabs: {
            indexId: INDEX_ID,
            taskId: task.id,
            videoId: task.videoId,
            status: 'indexing',
            indexedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', videoId);

    // Clean up temp file
    fs.unlinkSync(filepath);

    return task;
  } catch (err) {
    console.log('  ❌ Upload error:', err.message);
    if (err.body) console.log('  Body:', JSON.stringify(err.body));

    // Clean up temp file on error
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return null;
  }
}

async function main() {
  const videoIds = [
    '20bea41b-ce14-4f71-bbdb-47e54acdddfd',
    'd8708a86-2c1f-49a6-a500-6eea3cbe94c8',
    'dacdfe51-1448-43ff-a3b2-526e725fbb0b',
    '465d4f02-0e77-409b-a74d-016f23ed43c9',
    '8574db79-16ae-4da6-809f-0f9032a0420a',
    '35aaf1bc-44ff-4c50-8c0e-5b61b5433f33',
    '4a4b6802-c453-4cff-a728-09c62b5f898e',
    'ea32ea40-a1af-4bd3-ab9f-a701e9ccffbd',
    '3edd1459-43a6-43cf-ac4f-bc38e9fe5bdb',
    '5f53973e-0117-44bc-82ea-96fe1f7f467c'
  ];

  console.log('🚀 Starting Twelve Labs video indexing (download + upload)...');
  console.log('Using index:', INDEX_ID);
  console.log('Temp directory:', TEMP_DIR);

  let success = 0;
  for (const id of videoIds) {
    const result = await indexVideo(id);
    if (result) success++;
    // Wait a bit between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Done! Indexed', success, 'of', videoIds.length, 'videos');
  console.log('⏳ Indexing takes 2-5 minutes per video. Check status later.');
}

main();
