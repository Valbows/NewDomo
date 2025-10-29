// Backward compatibility route - forwards to new location
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Forward to new conversations/start endpoint
  const body = await request.text();
  
  const newUrl = new URL('/api/tavus/conversations/start', request.url);
  
  return fetch(newUrl.toString(), {
    method: 'POST',
    headers: request.headers,
    body: body,
  }).then(async (response) => {
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  });
}
