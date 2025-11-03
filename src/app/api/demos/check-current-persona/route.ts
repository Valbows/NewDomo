/**
 * Check Current Persona ID for Demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { demoService } from '@/lib/services/demos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const demoId = url.searchParams.get('demoId') || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

  console.log('🔍 CHECKING CURRENT PERSONA ID');
  console.log('='.repeat(50));
  console.log(`Demo ID: ${demoId}`);

  const result = await demoService.getCurrentPersonaStatus(demoId);

  if (!result.success) {
    const status = result.error === 'Demo not found' ? 404 : 500;
    return NextResponse.json({ 
      success: false, 
      error: result.error 
    }, { status });
  }

  const personaStatus = result.data!;

  // Log the results for debugging
  console.log(`✅ Demo: ${personaStatus.demo.name}`);
  console.log(`📋 Current Persona ID: ${personaStatus.demo.currentPersonaId || 'Not set'}`);
  console.log(`🔧 Environment Persona ID: ${personaStatus.environment.personaId || 'Not set'}`);
  
  if (personaStatus.persona) {
    console.log(`✅ Persona Name: ${personaStatus.persona.persona_name}`);
    console.log(`📋 Guardrails ID: ${personaStatus.persona.guardrails_id || 'None'}`);
    console.log(`🎯 Objectives ID: ${personaStatus.persona.objectives_id || 'None'}`);
  } else {
    console.log('⚠️  Could not fetch persona details from Tavus');
  }

  return NextResponse.json({
    success: true,
    demo: personaStatus.demo,
    environment: personaStatus.environment,
    persona: personaStatus.persona ? {
      id: personaStatus.persona.persona_id,
      name: personaStatus.persona.persona_name,
      guardrailsId: personaStatus.persona.guardrails_id,
      objectivesId: personaStatus.persona.objectives_id,
      createdAt: personaStatus.persona.created_at,
      updatedAt: personaStatus.persona.updated_at
    } : null,
    status: personaStatus.status
  });
}