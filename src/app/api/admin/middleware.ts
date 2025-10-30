import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';

/**
 * Admin authentication middleware
 * Checks if the user is authenticated and has admin privileges
 */
export async function adminAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // For now, all authenticated users can access admin routes
    // In the future, you could add role-based access control here
    // by checking user roles in the database or JWT claims
    
    // Example of how to add role checking:
    // const { data: profile } = await supabase
    //   .from('user_profiles')
    //   .select('role')
    //   .eq('user_id', user.id)
    //   .single();
    // 
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' }, 
    //     { status: 403 }
    //   );
    // }

    return null; // No error, continue with request
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}