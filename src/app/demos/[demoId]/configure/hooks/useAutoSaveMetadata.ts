import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Demo } from '../types';

export function useAutoSaveMetadata(
  demo: Demo | null,
  demoId: string,
  agentName: string,
  agentPersonality: string,
  agentGreeting: string,
  objectives: string[]
) {
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (demo) {
        const newMetadata = {
          ...demo.metadata,
          agentName,
          agentPersonality,
          agentGreeting,
          objectives: objectives.map((o) => (o || '').trim()).filter(Boolean).slice(0, 5),
        };

        if (JSON.stringify(newMetadata) === JSON.stringify(demo.metadata)) {
          return;
        }

        await supabase
          .from('demos')
          .update({ metadata: newMetadata })
          .eq('id', demoId);
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [agentName, agentPersonality, agentGreeting, objectives, demo, demoId]);
}
