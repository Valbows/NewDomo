import { NextRequest, NextResponse } from 'next/server';
import { validateObjectivesOverride } from '@/lib/tavus/custom-objectives-integration';

/**
 * Test API endpoint to verify that custom objectives properly override defaults
 * Usage: GET /api/test-objectives-override?demoId=your-demo-id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get('demoId');

    if (!demoId) {
      return NextResponse.json(
        { error: 'demoId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing objectives override for demo: ${demoId}`);

    // Run the validation
    const validation = await validateObjectivesOverride(demoId);

    // Determine if the override is working correctly
    const isWorkingCorrectly = 
      validation.overrideStatus === 'CUSTOM_OVERRIDING_DEFAULT' ||
      validation.overrideStatus === 'USING_DEFAULT_TEMPLATES';

    const response = {
      success: true,
      demoId,
      validation,
      summary: {
        overrideWorking: isWorkingCorrectly,
        usingCustomObjectives: validation.willUseCustom,
        finalObjectivesSource: validation.willUseCustom ? 'CUSTOM' : 'DEFAULT',
        message: validation.willUseCustom 
          ? `✅ Custom objectives "${validation.customObjectiveName}" are properly overriding defaults`
          : '📋 Using default template objectives (no custom objectives active)'
      }
    };

    console.log('🧪 Test Results:', response.summary);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error testing objectives override:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test objectives override'
      },
      { status: 500 }
    );
  }
}