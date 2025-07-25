import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
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

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
