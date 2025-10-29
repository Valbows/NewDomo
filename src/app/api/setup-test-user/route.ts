// Backward compatibility layer - redirects to new auth structure
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Redirect to new auth endpoint
  const url = new URL('/api/auth/setup-test-user', req.url);
  return NextResponse.redirect(url, { status: 308 });
}
