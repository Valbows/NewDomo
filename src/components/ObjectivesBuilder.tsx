'use client';

import React, { useState } from 'react';
import { getTavusService } from '@/lib/services/tavus';
import { OBJECTIVES_TEMPLATES } from '@/lib/tavus/objectives-templates';

interface Objective {
  objective_name: string;
  objective_prompt: string;
  confirmation_mode: 'auto' | 'manual';
  output_variables: string[];
  modality: 'verbal' | 'visual';
  next_required_objectives?: string[];
  next_conditional_objectives?: Record<string, string>;
}

interface ObjectivesBuilderProps {
  onObjectivesCreated: (objectivesId: string) => void;
}

export function ObjectivesBuilder({ onObjectivesCreated }: ObjectivesBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customObjectives, setCustomObjectives] = useState<Objective[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState<'template' | 'custom'>('template');

  const templates = [
    { key: 'PRODUCT_DEMO', name: 'Product Demo Flow', description: 'Complete product demonstration with Q&A' },
    { key: 'LEAD_QUALIFICATION', name: 'Lead Qualification', description: 'BANT methodology for qualifying prospects' },
    { key: 'CUSTOMER_SUPPORT', name: 'Customer Support', description: 'Onboarding and support assistance' }
  ];

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsCreating(true);
    try {
      const tavusService = getTavusService();
      const template = OBJECTIVES_TEMPLATES[selectedTemplate as keyof typeof OBJECTIVES_TEMPLATES];
      const result = await tavusService.services.objectives.createObjectives(template);
      if (result.success) {
        onObjectivesCreated(result.data!.uuid!);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create objectives:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCustom = async () => {
    if (customObjectives.length === 0) return;
    
    setIsCreating(true);
    try {
      const tavusService = getTavusService();
      const template = {
        name: "Custom Objectives",
        description: "User-defined conversation flow",
        objectives: customObjectives
      };
      const result = await tavusService.services.objectives.createObjectives(template);
      if (result.success) {
        onObjectivesCreated(result.data!.uuid!);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create custom objectives:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const addObjective = () => {
    setCustomObjectives([...customObjectives, {
      objective_name: '',
      objective_prompt: '',
      confirmation_mode: 'auto',
      output_variables: [],
      modality: 'verbal'
    }]);
  };

  const updateObjective = (index: number, field: keyof Objective, value: any) => {
    const updated = [...customObjectives];
    updated[index] = { ...updated[index], [field]: value };
    setCustomObjectives(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button
          onClick={() => setMode('template')}
          className={`px-4 py-2 rounded ${mode === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Use Template
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-4 py-2 rounded ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Build Custom
        </button>
      </div>

      {mode === 'template' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose a Template</h3>
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.key}
                className={`p-4 border rounded cursor-pointer ${
                  selectedTemplate === template.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate(template.key)}
              >
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleCreateFromTemplate}
            disabled={!selectedTemplate || isCreating}
            className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Objectives'}
          </button>
        </div>
      )}

      {mode === 'custom' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Build Custom Objectives</h3>
          
          {customObjectives.map((objective, index) => (
            <div key={index} className="p-4 border rounded space-y-3">
              <input
                type="text"
                placeholder="Objective name (e.g., welcome_user)"
                value={objective.objective_name}
                onChange={(e) => updateObjective(index, 'objective_name', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Objective prompt (what should the agent do?)"
                value={objective.objective_prompt}
                onChange={(e) => updateObjective(index, 'objective_prompt', e.target.value)}
                className="w-full p-2 border rounded h-24"
              />
              <div className="flex space-x-4">
                <select
                  value={objective.confirmation_mode}
                  onChange={(e) => updateObjective(index, 'confirmation_mode', e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="auto">Auto Confirm</option>
                  <option value="manual">Manual Confirm</option>
                </select>
                <select
                  value={objective.modality}
                  onChange={(e) => updateObjective(index, 'modality', e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="verbal">Verbal</option>
                  <option value="visual">Visual</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Output variables (comma-separated)"
                value={objective.output_variables.join(', ')}
                onChange={(e) => updateObjective(index, 'output_variables', e.target.value.split(', ').filter(Boolean))}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          
          <div className="flex space-x-4">
            <button
              onClick={addObjective}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Add Objective
            </button>
            <button
              onClick={handleCreateCustom}
              disabled={customObjectives.length === 0 || isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Custom Objectives'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}