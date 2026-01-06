import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errors';
import type { Demo } from '../types';

export async function handleSaveCTA(
  ctaTitle: string,
  ctaMessage: string,
  ctaButtonText: string,
  demo: Demo | null,
  demoId: string,
  setDemo: (demo: Demo) => void
) {
  try {

    const { error } = await supabase
      .from('demos')
      .update({
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
        metadata: {
          ...demo.metadata,
          ctaTitle,
          ctaMessage,
          ctaButtonText
        }
      });
    }

    alert('CTA settings saved successfully!');
  } catch (err: unknown) {
    logError(err, 'Error saving CTA settings');
    alert('Failed to save CTA settings.');
  }
}

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
    alert('Failed to save Admin CTA URL.');
    throw err; // rethrow so the editor can display inline error state
  }
}
