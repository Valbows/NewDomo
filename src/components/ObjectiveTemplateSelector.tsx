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
        <label className="block text-sm font-medium text-gray-700">
          Demo Objective Template
        </label>
        <span className="text-xs text-gray-500">
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
        <p className="text-sm text-amber-600">
          Please select an objective template for your agent
        </p>
      )}

      {/* Single unified template card with integrated dropdown */}
      {selectedTemplate && (
        <div className="border-2 border-indigo-500 rounded-lg overflow-hidden bg-indigo-50 ring-2 ring-indigo-200">
          {/* Template info header */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-indigo-900">{selectedTemplate.title}</h4>
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-sm text-indigo-700 mt-1">{selectedTemplate.description}</p>
                <p className="text-xs text-indigo-500 mt-2">{selectedTemplate.objectives.length} steps</p>
              </div>
            </div>
          </div>

          {/* Expandable steps section - connected */}
          <button
            type="button"
            onClick={() => setExpandedSteps(!expandedSteps)}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-100 hover:bg-indigo-200 transition-colors border-t border-indigo-200"
          >
            <span className="text-sm font-medium text-indigo-800">
              {expandedSteps ? 'Hide' : 'View'} Conversation Steps
            </span>
            {expandedSteps ? (
              <ChevronUp className="w-5 h-5 text-indigo-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {expandedSteps && (
            <div className="p-4 bg-white border-t border-indigo-200 space-y-3">
              {selectedTemplate.objectives.map((objective, index) => (
                <div
                  key={objective.objective_name}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 capitalize">
                      {objective.objective_name.replace(/_/g, ' ')}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {objective.objective_prompt}
                    </p>
                    {objective.output_variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {objective.output_variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
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

      <p className="text-xs text-gray-500">
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
      className={`relative text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-indigo-600" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
            {template.title}
          </h4>
          <p className={`text-sm mt-1 ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
            {template.description}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {template.objectives.length} steps
          </p>
        </div>
      </div>
    </button>
  );
}

export default ObjectiveTemplateSelector;
