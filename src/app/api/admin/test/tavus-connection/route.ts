// Backward compatibility route - forwards to new location
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Forward to new test/connection endpoint
  const newUrl = new URL('/api/tavus/test/connection', request.url);
  
  return fetch(newUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  }).then(async (response) => {
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  });
}