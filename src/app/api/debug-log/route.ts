import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug.log');

export async function POST(request: Request) {
  // Only process in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    const { level, message, data, source } = body;

    const timestamp = new Date().toISOString();
    const prefix = source ? `[${source}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const logLine = `${timestamp} [${level?.toUpperCase() || 'INFO'}] ${prefix} ${message}${dataStr}\n`;

    // Append to debug.log file
    fs.appendFileSync(LOG_FILE, logLine);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Silently handle errors - don't break the app for logging
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
