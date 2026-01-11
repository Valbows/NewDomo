import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errors';
import type { Demo } from '../types';

export async function handleSaveCTA(
  ctaTitle: string,
  ctaMessage: string,
  ctaButtonText: string,
  ctaUrl: string,
  demo: Demo | null,
  demoId: string,
  setDemo: (demo: Demo) => void
) {
  try {
    const { error } = await supabase
      .from('demos')
      .update({
        cta_button_url: ctaUrl || null,
        metadata: {
          ...demo?.metadata,
          ctaTitle,
          ctaMessage,
          ctaButtonText
        }
      })
      .eq('id', demoId);

    if (error) throw error;

    // Update local demo state
    if (demo) {
      setDemo({
        ...demo,
        cta_button_url: ctaUrl || null,
        metadata: {
          ...demo.metadata,
          ctaTitle,
          ctaMessage,
          ctaButtonText
        }
      });
    }
  } catch (err: unknown) {
    logError(err, 'Error saving CTA settings');
    throw err;
  }
}

// Keep for backwards compatibility
export async function handleSaveAdminCTAUrl(
  url: string,
  demoId: string,
  demo: Demo | null,
  setDemo: (demo: Demo) => void
) {
  try {
    const { error } = await supabase
      .from('demos')
      .update({ cta_button_url: url ? url : null })
      .eq('id', demoId);
    if (error) throw error;

    // Update local demo state
    if (demo) {
      setDemo({
        ...demo,
        cta_button_url: url ? url : null,
      });
    }
  } catch (err: unknown) {
    logError(err, 'Error saving admin CTA URL');
    throw err;
  }
}
