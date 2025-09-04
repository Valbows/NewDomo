import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Create the test user using Supabase's auth API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
    });

    if (error) {
      logError(error, 'Error creating test user');
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Test user created successfully',
      user: data.user 
    });

  } catch (error: unknown) {
    logError(error, 'Setup error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/setup-test-user',
});
