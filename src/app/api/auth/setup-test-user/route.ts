import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { userService } from '@/lib/services/auth';

async function handlePOST(req: NextRequest) {
  const result = await userService.createTestUser();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ 
    message: 'Test user created successfully',
    user: result.user 
  });
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/auth/setup-test-user',
});