import { NextRequest, NextResponse } from 'next/server';
import { debugLog } from '@/lib/debug-logger';

/**
 * API endpoint for client-side logging to debug.log
 * POST /api/debug-log
 * Body: { level: 'debug'|'info'|'warn'|'error', message: string, data?: any, source?: string }
 */
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug logging only available in development' }, { status: 403 });
  }

  try {
    const { level, message, data, source } = await req.json();

    if (!level || !message) {
      return NextResponse.json({ error: 'Missing level or message' }, { status: 400 });
    }

    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
    }

    // Add [CLIENT] prefix to distinguish from server logs
    const fullMessage = source ? `[CLIENT:${source}] ${message}` : `[CLIENT] ${message}`;
    debugLog(level, fullMessage, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
