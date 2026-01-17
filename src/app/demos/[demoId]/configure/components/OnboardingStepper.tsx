'use client';

import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

export interface StepStatus {
  videos: boolean;
  knowledge: boolean;
  agent: boolean;
  cta: boolean;
  embed: boolean;
}

interface OnboardingStepperProps {
  currentStep: number;
  stepStatus: StepStatus;
  onStepClick: (step: number) => void;
}

const STEPS = [
  { id: 1, key: 'videos', label: 'Videos', description: 'Upload demo videos' },
  { id: 2, key: 'knowledge', label: 'Knowledge Base', description: 'Add Q&A pairs' },
  { id: 3, key: 'agent', label: 'Agent Settings', description: 'Configure personality' },
  { id: 4, key: 'cta', label: 'Call-to-Action', description: 'Set up CTA' },
  { id: 5, key: 'embed', label: 'Embed', description: 'Deploy to website' },
] as const;

export function OnboardingStepper({ currentStep, stepStatus, onStepClick }: OnboardingStepperProps) {
  const allComplete = Object.values(stepStatus).every(Boolean);

  // Helper to check if a step is accessible (linear progression)
  const isStepAccessible = (stepId: number): boolean => {
    // Step 1 is always accessible
    if (stepId === 1) return true;

    // For other steps, all previous steps must be complete
    for (let i = 0; i < stepId - 1; i++) {
      const prevStepKey = STEPS[i].key as keyof StepStatus;
      if (!stepStatus[prevStepKey]) return false;
    }
    return true;
  };

  return (
    <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white font-heading">Setup Your Demo</h2>
        {allComplete && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-domo-success/10 text-domo-success border border-domo-success/20">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Setup Complete!
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isComplete = stepStatus[step.key as keyof StepStatus];
          const isCurrent = currentStep === step.id;
          const isAccessible = isStepAccessible(step.id);
          const isClickable = isAccessible; // Only accessible steps can be clicked

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`flex items-center group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                {/* Circle/Check */}
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${isComplete
                      ? 'bg-domo-success border-domo-success text-white'
                      : isCurrent
                        ? 'bg-domo-primary border-domo-primary text-white'
                        : isAccessible
                          ? 'bg-domo-bg-dark border-domo-border text-domo-text-muted group-hover:border-domo-primary/50'
                          : 'bg-domo-bg-dark border-domo-border/50 text-domo-text-muted/50'
                    }
                  `}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Label */}
                <div className="ml-3 text-left">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-domo-primary' : isComplete ? 'text-domo-success' : isAccessible ? 'text-white' : 'text-domo-text-muted'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className={`text-xs ${isAccessible ? 'text-domo-text-secondary' : 'text-domo-text-muted'}`}>{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 ${
                      isComplete ? 'bg-domo-success' : 'bg-domo-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-4 pt-4 border-t border-domo-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-domo-text-secondary">
            {Object.values(stepStatus).filter(Boolean).length} of {STEPS.length} steps completed
          </span>
          <div className="flex-1 mx-4 h-2 bg-domo-bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-domo-success transition-all duration-300"
              style={{
                width: `${(Object.values(stepStatus).filter(Boolean).length / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-white font-medium">
            {Math.round((Object.values(stepStatus).filter(Boolean).length / STEPS.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function getStepFromTab(tab: string): number {
  const stepMap: Record<string, number> = {
    videos: 1,
    knowledge: 2,
    agent: 3,
    cta: 4,
    embed: 5,
  };
  return stepMap[tab] || 1;
}

export function getTabFromStep(step: number): string {
  const tabMap: Record<number, string> = {
    1: 'videos',
    2: 'knowledge',
    3: 'agent',
    4: 'cta',
    5: 'embed',
  };
  return tabMap[step] || 'videos';
}
