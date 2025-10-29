// Backward compatibility route - forwards to new location
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Forward to new location
  const url = new URL('/api/webhooks/url', request.url);
  
  return fetch(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}