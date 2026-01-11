import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

// Parse PDF using unpdf (works in Node.js/Edge)
async function parsePDF(buffer: Buffer): Promise<string> {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(buffer));
  // result.text is an array of strings (one per page)
  const textArray = result.text || [];
  return Array.isArray(textArray) ? textArray.join('\n\n') : String(textArray);
}

// Parse DOCX using mammoth
async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Fetch and parse URL content
async function parseURL(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DomoBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  // If it's HTML, extract text content (basic extraction)
  if (contentType.includes('text/html')) {
    // Remove script and style tags and their contents
    let cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  return text;
}

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handle URL parsing (JSON request)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { url } = body;

      if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }

      const content = await parseURL(url);

      if (!content || content.trim().length === 0) {
        return NextResponse.json({ error: 'No content could be extracted from the URL' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        content,
        source: url,
        type: 'url',
      });
    }

    // Handle file upload (multipart form data)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let content: string;
    let fileType: string;

    if (fileName.endsWith('.pdf')) {
      content = await parsePDF(fileBuffer);
      fileType = 'pdf';
    } else if (fileName.endsWith('.docx')) {
      content = await parseDOCX(fileBuffer);
      fileType = 'docx';
    } else if (fileName.endsWith('.doc')) {
      // .doc files (old Word format) are not supported by mammoth
      return NextResponse.json({
        error: 'Old .doc format is not supported. Please convert to .docx or .pdf'
      }, { status: 400 });
    } else if (fileName.endsWith('.txt')) {
      content = fileBuffer.toString('utf-8');
      fileType = 'txt';
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Supported types: PDF, DOCX, TXT'
      }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content could be extracted from the file' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      content,
      source: file.name,
      type: fileType,
    });

  } catch (error: unknown) {
    logError(error, 'Parse Document Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/parse-document',
});
