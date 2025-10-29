import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { demoService } from '@/lib/services/demos';

async function handlePOST(req: NextRequest) {
  try {
    console.log('Creating test demo with videos...');

    // Use demo service to create test demo
    const result = await demoService.createTestDemo();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test demo and videos created successfully',
      demoId: result.data.demoId,
      videosCreated: result.data.videosCreated
    });

  } catch (error: unknown) {
    logError(error, 'Test demo creation error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGET(req: NextRequest) {
  // Allow GET requests to create test data for easy testing
  try {
    return await handlePOST(req);
  } catch (error: unknown) {
    logError(error, 'Test demo GET error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/create-test-demo',
});

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/create-test-demo',
});
