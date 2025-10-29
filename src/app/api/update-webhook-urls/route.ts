// Backward compatibility route - forwards to new location
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Forward to new location
  const url = new URL('/api/webhooks/update-urls', request.url);
  
  return fetch(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}

export async function POST(request: NextRequest) {
  // Forward to new location
  const url = new URL('/api/webhooks/update-urls', request.url);
  
  return fetch(url.toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });
}