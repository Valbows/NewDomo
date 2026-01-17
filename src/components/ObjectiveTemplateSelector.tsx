'use client';

import React from 'react';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DEMO_OBJECTIVE_TEMPLATES, DemoObjectiveTemplate, getTemplateById, DEFAULT_TEMPLATE_ID } from '@/lib/tavus/demo-objectives';

interface ObjectiveTemplateSelectorProps {
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  showValidation?: boolean;
}

export function ObjectiveTemplateSelector({
  selectedTemplateId,
  onSelect,
  showValidation = false,
}: ObjectiveTemplateSelectorProps) {
  const [expandedSteps, setExpandedSteps] = React.useState(false);

  // Auto-select the default template if only one exists and none selected
  React.useEffect(() => {
    if (!selectedTemplateId && DEMO_OBJECTIVE_TEMPLATES.length === 1) {
      onSelect(DEFAULT_TEMPLATE_ID);
    }
  }, [selectedTemplateId, onSelect]);

  const selectedTemplate = getTemplateById(selectedTemplateId) || DEMO_OBJECTIVE_TEMPLATES[0];
  const isSingleTemplate = DEMO_OBJECTIVE_TEMPLATES.length === 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-domo-text-secondary">
          Demo Objective Template
        </label>
        <span className="text-xs text-domo-text-muted">
          Defines the conversation flow
        </span>
      </div>

      {/* Show grid only if multiple templates exist */}
      {!isSingleTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_OBJECTIVE_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      )}

      {/* Validation message */}
      {showValidation && !selectedTemplateId && (
        <p className="text-sm text-amber-400">
          Please select an objective template for your agent
        </p>
      )}

      {/* Single unified template card with integrated dropdown */}
      {selectedTemplate && (
        <div className="border-2 border-domo-primary rounded-xl overflow-hidden bg-domo-primary/10 ring-2 ring-domo-primary/20">
          {/* Template info header */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">{selectedTemplate.title}</h4>
                  <CheckCircle className="w-5 h-5 text-domo-primary" />
                </div>
                <p className="text-sm text-domo-text-secondary mt-1">{selectedTemplate.description}</p>
                <p className="text-xs text-domo-text-muted mt-2">{selectedTemplate.objectives.length} steps</p>
              </div>
            </div>
          </div>

          {/* Expandable steps section - connected */}
          <button
            type="button"
            onClick={() => setExpandedSteps(!expandedSteps)}
            className="w-full flex items-center justify-between px-4 py-3 bg-domo-primary/20 hover:bg-domo-primary/30 transition-colors border-t border-domo-primary/30"
          >
            <span className="text-sm font-medium text-white">
              {expandedSteps ? 'Hide' : 'View'} Conversation Steps
            </span>
            {expandedSteps ? (
              <ChevronUp className="w-5 h-5 text-domo-primary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-domo-primary" />
            )}
          </button>

          {expandedSteps && (
            <div className="p-4 bg-domo-bg-dark border-t border-domo-primary/30 space-y-3">
              {selectedTemplate.objectives.map((objective, index) => (
                <div
                  key={objective.objective_name}
                  className="flex gap-3 p-3 bg-domo-bg-elevated rounded-lg"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-domo-primary/20 text-domo-primary flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-white capitalize">
                      {objective.objective_name.replace(/_/g, ' ')}
                    </h5>
                    <p className="text-sm text-domo-text-secondary mt-1">
                      {objective.objective_prompt}
                    </p>
                    {objective.output_variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {objective.output_variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs bg-domo-bg-dark text-domo-text-muted px-2 py-0.5 rounded"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-domo-text-muted">
        This template defines how the AI agent guides conversations during demos with {selectedTemplate?.objectives.length || 4} optimized conversation steps.
      </p>
    </div>
  );
}

interface TemplateCardProps {
  template: DemoObjectiveTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-domo-primary bg-domo-primary/10 ring-2 ring-domo-primary/20'
          : 'border-domo-border bg-domo-bg-dark hover:border-domo-border/80 hover:bg-domo-bg-elevated'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-domo-primary" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-domo-text-secondary'}`}>
            {template.title}
          </h4>
          <p className={`text-sm mt-1 ${isSelected ? 'text-domo-text-secondary' : 'text-domo-text-muted'}`}>
            {template.description}
          </p>
          <p className="text-xs text-domo-text-muted mt-2">
            {template.objectives.length} steps
          </p>
        </div>
      </div>
    </button>
  );
}

export default ObjectiveTemplateSelector;
