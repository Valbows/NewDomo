// Backward compatibility layer - redirects to new demos structure
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Redirect to new demos endpoint
  const url = new URL('/api/demos/create-test', req.url);
  return NextResponse.redirect(url, { status: 308 });
}

export async function GET(req: NextRequest) {
  // Redirect to new demos endpoint
  const url = new URL('/api/demos/create-test', req.url);
  return NextResponse.redirect(url, { status: 308 });
}
