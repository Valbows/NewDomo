import React from 'react';
import {Plus, Trash2} from 'lucide-react';
import {ObjectiveDefinition} from '@/lib/services/tavus/types';

interface ObjectiveFormProps {
  formData: {
    name: string;
    description: string;
    objectives: ObjectiveDefinition[];
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  editingObjective: any;
}

const EMPTY_OBJECTIVE: ObjectiveDefinition = {
  objective_name: '',
  objective_prompt: '',
  confirmation_mode: 'auto',
  output_variables: [],
  modality: 'verbal',
  callback_url: '',
};

export function ObjectiveForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  loading, 
  editingObjective 
}: ObjectiveFormProps) {
  const addObjectiveStep = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { ...EMPTY_OBJECTIVE }],
    });
  };

  const removeObjectiveStep = (index: number) => {
    if (formData.objectives.length > 1) {
      setFormData({
        ...formData,
        objectives: formData.objectives.filter((_, i) => i !== index),
      });
    }
  };

  const updateObjectiveStep = (index: number, field: keyof ObjectiveDefinition, value: any) => {
    const updated = [...formData.objectives];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, objectives: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingObjective ? 'Edit Objective Set' : 'Create New Objective Set'}
          </h3>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Product Demo Flow"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this objective set"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Objective Steps ({formData.objectives.length})
                </label>
                <button
                  type="button"
                  onClick={addObjectiveStep}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Plus className="w-3 h-3" />
                  Add Step
                </button>
              </div>

              <div className="space-y-4">
                {formData.objectives.map((obj, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">Step {index + 1}</h4>
                      {formData.objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjectiveStep(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Step Name *
                        </label>
                        <input
                          type="text"
                          value={obj.objective_name}
                          onChange={(e) => updateObjectiveStep(index, 'objective_name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="e.g., welcome_user"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Confirmation
                          </label>
                          <select
                            value={obj.confirmation_mode}
                            onChange={(e) => updateObjectiveStep(index, 'confirmation_mode', e.target.value as 'auto' | 'manual')}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="auto">Auto</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Modality
                          </label>
                          <select
                            value={obj.modality}
                            onChange={(e) => updateObjectiveStep(index, 'modality', e.target.value as 'verbal' | 'visual')}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="verbal">Verbal</option>
                            <option value="visual">Visual</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Objective Prompt *
                      </label>
                      <textarea
                        value={obj.objective_prompt}
                        onChange={(e) => updateObjectiveStep(index, 'objective_prompt', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                        placeholder="Describe what the agent should do in this step..."
                        required
                      />
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Output Variables (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={
                          Array.isArray(obj.output_variables) 
                            ? obj.output_variables.join(', ') 
                            : typeof obj.output_variables === 'object' && obj.output_variables
                              ? Object.keys(obj.output_variables).join(', ')
                              : ''
                        }
                        onChange={(e) => updateObjectiveStep(index, 'output_variables', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., user_name, company_name, interest_level"
                      />
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Webhook URL (optional)
                      </label>
                      <input
                        type="url"
                        value={obj.callback_url || ''}
                        onChange={(e) => updateObjectiveStep(index, 'callback_url', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="https://your-server.com/webhook/endpoint"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Webhook will receive output variables when this objective completes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingObjective ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}