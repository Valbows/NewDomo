import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';

async function handlePOST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Create the test user using Supabase's auth API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password',
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating test user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Test user created successfully',
      user: data.user 
    });

  } catch (error: unknown) {
    console.error('Setup error:', error);
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/setup-test-user',
});
