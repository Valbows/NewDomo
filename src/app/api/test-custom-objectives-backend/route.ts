/**
 * Backend Test for Custom Objectives Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {

    const supabase = createClient();
    const demoId = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

    // Test 1: Direct database query
    const { data: objectives, error } = await supabase
      .from('custom_objectives')
      .select('*')
      .eq('demo_id', demoId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed', 
        details: error.message 
      }, { status: 500 });
    }


    if (!objectives || objectives.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No custom objectives found in database',
        objectives: [],
        activeObjective: null
      });
    }

    // Test 2: Find active objective
    const activeObjective = objectives.find(obj => obj.is_active);

    if (!activeObjective) {
      return NextResponse.json({
        success: false,
        message: 'No active custom objective found',
        objectives: objectives.map(obj => ({
          id: obj.id,
          name: obj.name,
          is_active: obj.is_active,
          steps: obj.objectives.length
        })),
        activeObjective: null
      });
    }


    // Test 3: Test the integration function
    try {
      const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
      const integrationResult = await getActiveCustomObjective(demoId);

      if (integrationResult) {
      } else {
      }

      // Test 4: Simulate agent creation logic
      let objectivesSection = '';
      
      if (integrationResult && integrationResult.objectives.length > 0) {
        objectivesSection = `\n\n## DEMO OBJECTIVES (${integrationResult.name})\n`;
        objectivesSection += `${integrationResult.description ? integrationResult.description + '\n\n' : ''}`;
        objectivesSection += 'Follow these structured objectives throughout the conversation:\n\n';
        
        integrationResult.objectives.forEach((obj, i) => {
          objectivesSection += `### ${i + 1}. ${obj.objective_name}\n`;
          objectivesSection += `**Objective:** ${obj.objective_prompt}\n`;
          objectivesSection += `**Mode:** ${obj.confirmation_mode} confirmation, ${obj.modality} modality\n`;
          if (obj.output_variables && obj.output_variables.length > 0) {
            objectivesSection += `**Capture:** ${obj.output_variables.join(', ')}\n`;
          }
          objectivesSection += '\n';
        });

      } else {
      }

      // Test 5: Check Workday content
      const hasWorkdayName = activeObjective.name.toLowerCase().includes('workday');
      const hasDomoGreeting = activeObjective.objectives.some((step: any) => 
        step.objective_prompt.toLowerCase().includes('domo')
      );
      const hasGreetingStep = activeObjective.objectives.some((step: any) => 
        step.objective_name.includes('greeting')
      );


      const isWorkdayDemo = hasWorkdayName && hasDomoGreeting && hasGreetingStep;

      return NextResponse.json({
        success: true,
        message: isWorkdayDemo ? 'Custom objectives are working correctly!' : 'Custom objectives found but may not be Workday demo',
        demoId,
        totalObjectives: objectives.length,
        activeObjective: {
          id: activeObjective.id,
          name: activeObjective.name,
          description: activeObjective.description,
          steps: activeObjective.objectives.length,
          tavus_objectives_id: activeObjective.tavus_objectives_id,
          is_active: activeObjective.is_active,
          created_at: activeObjective.created_at
        },
        objectiveSteps: activeObjective.objectives.map((step: any, i: number) => ({
          step: i + 1,
          name: step.objective_name,
          prompt: step.objective_prompt.substring(0, 100) + '...',
          mode: step.confirmation_mode,
          modality: step.modality,
          variables: step.output_variables || []
        })),
        validation: {
          hasWorkdayName,
          hasDomoGreeting,
          hasGreetingStep,
          isWorkdayDemo
        },
        integrationTest: {
          functionWorks: !!integrationResult,
          objectivesSectionGenerated: objectivesSection.length > 0,
          objectivesSectionLength: objectivesSection.length
        },
        generatedObjectivesSection: objectivesSection.substring(0, 500) + '...'
      });

    } catch (integrationError) {
      return NextResponse.json({
        success: false,
        message: 'Integration function failed',
        error: integrationError instanceof Error ? integrationError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Backend test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}