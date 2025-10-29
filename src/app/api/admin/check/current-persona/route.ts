// Backward compatibility layer - redirects to new demos structure
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to new demos endpoint with query parameters preserved
  const url = new URL('/api/demos/check-current-persona', req.url);
  url.search = req.nextUrl.search; // Preserve query parameters
  return NextResponse.redirect(url, { status: 308 });
}