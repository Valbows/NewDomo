import { useMemo } from 'react';
import { StepStatus } from '../components/OnboardingStepper';
import { Demo, DemoVideo, KnowledgeChunk } from '../types';

export function useOnboardingStatus(
  demo: Demo | null,
  demoVideos: DemoVideo[],
  knowledgeChunks: KnowledgeChunk[]
): { stepStatus: StepStatus; isOnboardingComplete: boolean; firstIncompleteStep: number } {
  const stepStatus = useMemo<StepStatus>(() => {
    // Step 1: Videos - at least one video uploaded
    const videosComplete = demoVideos.length > 0;

    // Step 2: Knowledge Base - at least one Q&A pair or document
    const knowledgeComplete = knowledgeChunks.length > 0;

    // Step 3: Agent Settings - Tavus persona created (agent exists)
    const agentComplete = Boolean(demo?.tavus_persona_id);

    // Step 4: CTA - CTA URL is set (main requirement)
    const ctaComplete = Boolean(demo?.cta_button_url);

    // Step 5: Embed - user has enabled embedding (is_embeddable = true)
    const embedComplete = Boolean(demo?.is_embeddable);

    return {
      videos: videosComplete,
      knowledge: knowledgeComplete,
      agent: agentComplete,
      cta: ctaComplete,
      embed: embedComplete,
    };
  }, [demo, demoVideos, knowledgeChunks]);

  const isOnboardingComplete = useMemo(() => {
    return Object.values(stepStatus).every(Boolean);
  }, [stepStatus]);

  const firstIncompleteStep = useMemo(() => {
    if (!stepStatus.videos) return 1;
    if (!stepStatus.knowledge) return 2;
    if (!stepStatus.agent) return 3;
    if (!stepStatus.cta) return 4;
    if (!stepStatus.embed) return 5;
    return 1; // All complete, default to first
  }, [stepStatus]);

  return { stepStatus, isOnboardingComplete, firstIncompleteStep };
}
