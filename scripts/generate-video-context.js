require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const { TwelvelabsApiClient } = require('twelvelabs-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const client = new TwelvelabsApiClient({ apiKey: process.env.TWELVE_LABS_API_KEY });

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function generateContextForVideo(video) {
  const videoId = video.metadata?.twelvelabs?.videoId;
  if (!videoId) {
    console.log(`  ⚠️  No Twelve Labs videoId found`);
    return null;
  }

  console.log(`  🔍 Video ID: ${videoId}`);

  try {
    // Generate summary
    console.log('  📝 Generating summary...');
    const summaryResult = await client.summarize({
      videoId: videoId,
      type: 'summary',
      prompt: 'Provide a detailed summary of this demo video. Include the main features demonstrated, key UI elements shown, and the flow of the demonstration. Format as bullet points.'
    });

    const summary = summaryResult.summary || 'Unable to generate summary';
    console.log('  ✅ Summary generated');

    // Generate chapters
    console.log('  📚 Generating chapters...');
    let chapters = [];
    try {
      const chapterResult = await client.summarize({
        videoId: videoId,
        type: 'chapter'
      });

      if (chapterResult.chapters && Array.isArray(chapterResult.chapters)) {
        chapters = chapterResult.chapters.map(ch => ({
          start: ch.start || 0,
          end: ch.end || 0,
          title: ch.chapter_title || ch.chapter_summary || ''
        }));
      }
      console.log(`  ✅ Generated ${chapters.length} chapters`);
    } catch (err) {
      console.log('  ⚠️  Chapters not available:', err.message);
    }

    // Build context string
    let context = `## Video Content Overview\n\n${summary}\n\n`;

    if (chapters.length > 0) {
      context += `## Video Chapters\n\n`;
      chapters.forEach((ch, i) => {
        context += `${i + 1}. [${formatTimestamp(ch.start)} - ${formatTimestamp(ch.end)}] ${ch.title}\n`;
      });
    }

    return context;
  } catch (err) {
    console.log('  ❌ Error generating context:', err.message);
    return null;
  }
}

async function main() {
  console.log('🎬 Generating AI context for indexed videos...\n');

  // Get all videos with Twelve Labs metadata
  const { data: videos, error } = await supabase
    .from('demo_videos')
    .select('id, title, demo_id, metadata')
    .not('metadata->twelvelabs->videoId', 'is', null);

  if (error || !videos || videos.length === 0) {
    console.log('No indexed videos found.');
    return;
  }

  console.log(`Found ${videos.length} indexed videos\n`);

  let success = 0;
  for (const video of videos) {
    console.log(`\n📹 ${video.title}`);

    const context = await generateContextForVideo(video);

    if (context) {
      // Update database with generated context
      const { error: updateError } = await supabase
        .from('demo_videos')
        .update({
          metadata: {
            ...video.metadata,
            twelvelabs: {
              ...video.metadata.twelvelabs,
              generatedContext: context,
              contextGeneratedAt: new Date().toISOString()
            }
          }
        })
        .eq('id', video.id);

      if (updateError) {
        console.log('  ❌ Error saving context:', updateError.message);
      } else {
        console.log('  💾 Context saved to database');
        success++;
      }
    }

    // Wait between requests to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n\n✅ Done! Generated context for ${success}/${videos.length} videos`);
  console.log('\n📋 The AI agent will now have video awareness when you create/update it!');
}

main();
