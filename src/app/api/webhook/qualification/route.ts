// Backward compatibility route - forwards to new location
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Forward to new location
  const url = new URL('/api/webhooks/events/qualification', request.url);
  
  return fetch(url.toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });
}

export async function GET(request: NextRequest) {
  // Forward to new location
  const url = new URL('/api/webhooks/events/qualification', request.url);
  
  return fetch(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}