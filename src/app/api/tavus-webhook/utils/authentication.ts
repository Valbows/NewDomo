import { NextRequest, NextResponse } from 'next/server';
import { verifyHmacSha256Signature } from '@/lib/security/webhooks';

export async function verifyWebhookAuthentication(req: NextRequest): Promise<{ authenticated: boolean; rawBody: string }> {
  const secret = process.env.TAVUS_WEBHOOK_SECRET;
  const signature =
    req.headers.get('x-tavus-signature') ||
    req.headers.get('tavus-signature') ||
    req.headers.get('x-signature');

  // Support both NextRequest (with nextUrl) and standard Request in tests
  const urlObj = (req as any)?.nextUrl ?? new URL((req as any)?.url);
  const tokenParam = urlObj.searchParams.get('t') || urlObj.searchParams.get('token');
  const tokenEnv = process.env.TAVUS_WEBHOOK_TOKEN;

  const rawBody = await req.text();
  const hmacOk = !!secret && verifyHmacSha256Signature(rawBody, signature, secret);
  const tokenOk = !!tokenEnv && !!tokenParam && tokenParam === tokenEnv;

  return {
    authenticated: hmacOk || tokenOk,
    rawBody
  };
}
