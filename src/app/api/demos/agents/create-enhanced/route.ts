/**
 * Enhanced Agent Creation API
 * Automatically integrates: System Prompt + Guardrails + Preset Objectives + Custom Objectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { agentService } from '@/lib/services/demos';
import { getWebhookUrl } from '@/lib/tavus';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

async function handlePOST(req: AuthenticatedRequest): Promise<NextResponse> {
  const supabase = createClient();

  try {
    const user = getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, agentName, agentPersonality, agentGreeting } = await req.json();

    if (!demoId || !agentName) {
      return NextResponse.json({ error: 'Demo ID and agent name are required' }, { status: 400 });
    }

    console.log('🤖 CREATING ENHANCED AGENT');
    console.log('='.repeat(50));
    console.log(`Demo ID: ${demoId}`);
    console.log(`Agent Name: ${agentName}`);
    console.log(`🔗 Webhook URL: ${getWebhookUrl()}`);
    console.log('📋 Objectives will automatically include webhook URLs for data collection');

    // Use agent service to create the enhanced agent
    const result = await agentService.createEnhancedAgent({
      demoId,
      agentName,
      agentPersonality,
      agentGreeting
    }, user.id);

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error 
      }, { status: 500 });
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 AGENT CONFIGURED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`Agent Name: ${agentName}`);
    console.log(`Persona ID: ${result.data.personaId}`);

    return NextResponse.json({
      success: true,
      agentId: result.data.personaId,
      personaId: result.data.personaId,
      demoId: result.data.demoId,
      configuration: result.data.configuration,
      message: result.data.message,
      personaType: result.data.personaType
    });

  } catch (error: unknown) {
    logError(error, 'Enhanced Agent Creation Error');
    const message = getErrorMessage(error);
    console.error('❌ Enhanced agent creation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(withAuth(handlePOST), {
  method: 'POST',
  parameterizedRoute: '/api/demos/agents/create-enhanced',
});