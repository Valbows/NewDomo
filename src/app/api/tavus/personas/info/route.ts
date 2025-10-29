/**
 * Get Persona Information API (Authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { demoService } from '@/lib/services/demos';

async function handleGET(request: AuthenticatedRequest) {
  try {
    const supabase = createClient();
    const user = getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const demoId = url.searchParams.get('demoId') || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

    // Use demo service to get persona info
    const result = await demoService.getPersonaInfo(demoId, user.id);

    if (!result.success) {
      const status = result.error === 'Demo not found' ? 404 : 500;
      return NextResponse.json({ 
        success: false,
        error: result.error 
      }, { status });
    }

    return NextResponse.json({
      success: true,
      ...result.data
    });

  } catch (error: unknown) {
    logError(error, 'Get Persona Info Error');
    const message = getErrorMessage(error);
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}

export const GET = wrapRouteHandlerWithSentry(withAuth(handleGET), {
  method: 'GET',
  parameterizedRoute: '/api/tavus/personas/info',
});