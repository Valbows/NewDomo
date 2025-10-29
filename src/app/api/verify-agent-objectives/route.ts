// Backward compatibility route - forwards to new location
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Forward to new admin/verify/agent-objectives endpoint
  const url = new URL(request.url);
  const newUrl = new URL('/api/admin/verify/agent-objectives', url.origin);
  
  // Copy query parameters
  url.searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value);
  });
  
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