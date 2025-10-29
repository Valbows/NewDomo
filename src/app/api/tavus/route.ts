// Backward compatibility route - forwards to new location
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Redirect to new videos endpoint
  return NextResponse.redirect(new URL('/api/tavus/videos', request.url), 308);
}
