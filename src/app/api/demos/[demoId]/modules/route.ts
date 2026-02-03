import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';

// Debug logging helper (only in development)
const debugLog = (endpoint: string, message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DemoModules ${endpoint}] ${message}`, data !== undefined ? data : '');
  }
};

/**
 * GET /api/demos/[demoId]/modules
 *
 * Get modules for a demo. If none exist, returns default modules.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { demoId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const { demoId } = params;
    debugLog('GET', 'Fetching modules', { demoId });

    // Fetch custom modules for this demo
    const { data: customModules, error } = await supabase
      .from('demo_modules')
      .select('*')
      .eq('demo_id', demoId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    // If no custom modules, return defaults
    if (!customModules || customModules.length === 0) {
      debugLog('GET', 'No custom modules, returning defaults', { demoId });
      return NextResponse.json({
        modules: DEFAULT_PRODUCT_DEMO_MODULES.map((m) => ({
          id: null, // Not saved yet
          demo_id: demoId,
          module_id: m.moduleId,
          name: m.name,
          description: m.description,
          order_index: m.orderIndex,
          requires_video: m.requiresVideo,
          upload_guidance: m.uploadGuidance,
          is_default: true,
        })),
        isDefault: true,
      });
    }

    debugLog('GET', 'Found custom modules', { demoId, count: customModules.length });
    return NextResponse.json({
      modules: customModules,
      isDefault: false,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[DemoModules GET] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/demos/[demoId]/modules
 *
 * Initialize custom modules for a demo (copies defaults or creates custom).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { demoId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const { demoId } = params;
    const body = await req.json();
    const { useDefaults = true, modules } = body;

    debugLog('POST', 'Initializing modules', { demoId, useDefaults, customModulesCount: modules?.length });

    // Check if modules already exist
    const { data: existing } = await supabase
      .from('demo_modules')
      .select('id')
      .eq('demo_id', demoId)
      .limit(1);

    if (existing && existing.length > 0) {
      debugLog('POST', 'Modules already exist', { demoId });
      return NextResponse.json(
        { error: 'Modules already exist for this demo' },
        { status: 400 }
      );
    }

    // Create modules from defaults or provided data
    const modulesToInsert = useDefaults
      ? DEFAULT_PRODUCT_DEMO_MODULES.map((m) => ({
          demo_id: demoId,
          module_id: m.moduleId,
          name: m.name,
          description: m.description,
          order_index: m.orderIndex,
          requires_video: m.requiresVideo,
          upload_guidance: m.uploadGuidance,
        }))
      : modules.map((m: any, index: number) => ({
          demo_id: demoId,
          module_id: m.module_id || `custom_${index + 1}`,
          name: m.name,
          description: m.description || '',
          order_index: m.order_index ?? index + 1,
          requires_video: m.requires_video ?? false,
          upload_guidance: m.upload_guidance || '',
        }));

    debugLog('POST', 'Inserting modules', { count: modulesToInsert.length });

    const { data: inserted, error } = await supabase
      .from('demo_modules')
      .insert(modulesToInsert)
      .select();

    if (error) {
      throw error;
    }

    debugLog('POST', 'Modules created successfully', { count: inserted?.length });
    return NextResponse.json({ modules: inserted });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[DemoModules POST] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/demos/[demoId]/modules
 *
 * Update a specific module.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { demoId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const { demoId } = params;
    const body = await req.json();
    const { moduleId, updates } = body;

    debugLog('PATCH', 'Updating module', { demoId, moduleId, updates });

    if (!moduleId) {
      return NextResponse.json(
        { error: 'moduleId is required' },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'description', 'order_index', 'requires_video', 'upload_guidance'];
    const sanitizedUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      debugLog('PATCH', 'No valid fields to update', { moduleId });
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    debugLog('PATCH', 'Applying updates', { moduleId, sanitizedUpdates });

    const { data: updated, error } = await supabase
      .from('demo_modules')
      .update(sanitizedUpdates)
      .eq('demo_id', demoId)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    debugLog('PATCH', 'Module updated successfully', { moduleId, updatedModule: updated });
    return NextResponse.json({ module: updated });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[DemoModules PATCH] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/demos/[demoId]/modules
 *
 * Delete a module or reset to defaults.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { demoId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const { demoId } = params;
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');
    const resetToDefaults = searchParams.get('resetToDefaults') === 'true';

    debugLog('DELETE', 'Delete request', { demoId, moduleId, resetToDefaults });

    if (resetToDefaults) {
      debugLog('DELETE', 'Resetting to defaults', { demoId });
      // Delete all custom modules for this demo
      const { error } = await supabase
        .from('demo_modules')
        .delete()
        .eq('demo_id', demoId);

      if (error) {
        throw error;
      }

      debugLog('DELETE', 'Reset to defaults successful', { demoId });
      return NextResponse.json({ success: true, message: 'Reset to defaults' });
    }

    if (!moduleId) {
      return NextResponse.json(
        { error: 'moduleId is required (or use resetToDefaults=true)' },
        { status: 400 }
      );
    }

    debugLog('DELETE', 'Deleting single module', { demoId, moduleId });

    const { error } = await supabase
      .from('demo_modules')
      .delete()
      .eq('demo_id', demoId)
      .eq('id', moduleId);

    if (error) {
      throw error;
    }

    debugLog('DELETE', 'Module deleted successfully', { moduleId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[DemoModules DELETE] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
