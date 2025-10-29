/**
 * Get Persona Information API (Authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { demoService } from '@/lib/services/demos';
import { getTavusService } from '@/lib/services/tavus';

async function handleGET(request: AuthenticatedRequest, { params }: { params: { demoId: string } }) {
  try {
    const supabase = createClient();
    const user = getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demoId = params.demoId;

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

export const GET = withAuth(handleGET);