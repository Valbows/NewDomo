// Backward compatibility layer - redirects to new demos structure
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Redirect to new demos endpoint
  const url = new URL('/api/demos/agents/create-enhanced', req.url);
  return NextResponse.redirect(url, { status: 308 });
}