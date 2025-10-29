import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { userService } from '@/lib/services/auth';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

async function handleGET(req: AuthenticatedRequest) {
  const user = getRequestUser(req);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await userService.getUserById(user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    user: result.user
  });
}

async function handlePUT(req: AuthenticatedRequest) {
  const user = getRequestUser(req);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await userService.updateUser(user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: result.user
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request body' 
    }, { status: 400 });
  }
}

export const GET = wrapRouteHandlerWithSentry(withAuth(handleGET), {
  method: 'GET',
  parameterizedRoute: '/api/auth/user',
});

export const PUT = wrapRouteHandlerWithSentry(withAuth(handlePUT), {
  method: 'PUT',
  parameterizedRoute: '/api/auth/user',
});