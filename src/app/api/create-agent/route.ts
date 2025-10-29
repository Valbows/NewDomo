import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { agentService } from '@/lib/services/demos';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

async function handlePOST(req: AuthenticatedRequest) {
  try {
    const user = getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, agentName, agentPersonality, agentGreeting } = await req.json();

    if (!demoId || !agentName) {
      return NextResponse.json({ error: 'Missing required agent configuration' }, { status: 400 });
    }
    // Use agent service to create the agent
    const result = await agentService.createAgent({
      demoId,
      agentName,
      agentPersonality,
      agentGreeting
    }, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: result.data.message,
      personaId: result.data.personaId
    });

  } catch (error: unknown) {
    logError(error, 'Agent Creation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(
  withAuth(handlePOST, { requireAuth: true }),
  {
    method: 'POST',
    parameterizedRoute: '/api/create-agent',
  }
);
