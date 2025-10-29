import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { authService } from '@/lib/services/auth';

async function handleGET(req: NextRequest) {
  const result = await authService.getCurrentSession();

  if (!result.success) {
    return NextResponse.json({ 
      error: result.error,
      session: null 
    }, { status: 401 });
  }

  return NextResponse.json({ 
    success: true,
    session: result.session,
    user: result.session?.user
  });
}

async function handleDELETE(req: NextRequest) {
  const result = await authService.signOut();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: 'Session ended successfully'
  });
}

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/auth/session',
});

export const DELETE = wrapRouteHandlerWithSentry(handleDELETE, {
  method: 'DELETE',
  parameterizedRoute: '/api/auth/session',
});