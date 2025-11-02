#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Missing envs: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Create a simple test video buffer (minimal MP4 header)
function createTestVideoBuffer(title) {
  // This creates a minimal valid MP4 file that browsers can recognize
  const mp4Header = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x20,
    0x66,
    0x74,
    0x79,
    0x70, // ftyp box
    0x69,
    0x73,
    0x6f,
    0x6d,
    0x00,
    0x00,
    0x02,
    0x00,
    0x69,
    0x73,
    0x6f,
    0x6d,
    0x69,
    0x73,
    0x6f,
    0x32,
    0x61,
    0x76,
    0x63,
    0x31,
    0x6d,
    0x70,
    0x34,
    0x31,
    0x00,
    0x00,
    0x00,
    0x08,
    0x66,
    0x72,
    0x65,
    0x65, // free box
  ]);

  // Add title as metadata
  const titleBuffer = Buffer.from(title, "utf8");
  return Buffer.concat([mp4Header, titleBuffer]);
}

(async () => {
  console.log("📹 Uploading test video files...");

  const testVideos = [
    { title: "E2E Test Video", path: "test-videos/e2e-test-video.mp4" },
    { title: "Strategic Planning", path: "test-videos/strategic-planning.mp4" },
    { title: "Product Demo", path: "test-videos/product-demo.mp4" },
  ];

  for (const video of testVideos) {
    try {
      const videoBuffer = createTestVideoBuffer(video.title);

      const { data, error } = await admin.storage
        .from("demo-videos")
        .upload(video.path, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (error) {
        console.error(`❌ Failed to upload ${video.title}:`, error.message);
      } else {
        console.log(`✅ Uploaded: ${video.title} -> ${video.path}`);
      }
    } catch (err) {
      console.error(`❌ Error uploading ${video.title}:`, err.message);
    }
  }

  console.log("🎉 Test video upload complete!");
})().catch((e) => {
  console.error("❌ Upload failed:", e);
  process.exit(1);
});
