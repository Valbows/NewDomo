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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Setup Your Demo</h2>
        {allComplete && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Setup Complete!
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isComplete = stepStatus[step.key as keyof StepStatus];
          const isCurrent = currentStep === step.id;
          const isClickable = true; // Allow clicking any step

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex items-center group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Circle/Check */}
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${isComplete
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500 group-hover:border-indigo-400'
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
                      isCurrent ? 'text-indigo-600' : isComplete ? 'text-green-600' : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 ${
                      stepStatus[STEPS[index + 1].key as keyof StepStatus] || isComplete
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {Object.values(stepStatus).filter(Boolean).length} of {STEPS.length} steps completed
          </span>
          <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(Object.values(stepStatus).filter(Boolean).length / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-gray-600 font-medium">
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
