// Backward compatibility route - forwards to new location
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Forward to new admin/test/webhook endpoint
  const url = new URL(request.url);
  const newUrl = new URL('/api/admin/test/webhook', url.origin);
  
  return fetch(newUrl.toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  }).then(async (response) => {
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  });
}
