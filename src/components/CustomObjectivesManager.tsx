'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, Copy, CheckCircle } from 'lucide-react';
import { useCustomObjectives } from '@/hooks/useCustomObjectives';
import { ObjectiveDefinition } from '@/lib/tavus/objectives-templates';
import { CustomObjective } from '@/lib/supabase/custom-objectives';

interface CustomObjectivesManagerProps {
  demoId: string;
}

interface ObjectiveFormData {
  name: string;
  description: string;
  objectives: ObjectiveDefinition[];
}

const EMPTY_OBJECTIVE: ObjectiveDefinition = {
  objective_name: '',
  objective_prompt: '',
  confirmation_mode: 'auto',
  output_variables: [],
  modality: 'verbal',
};

export function CustomObjectivesManager({ demoId }: CustomObjectivesManagerProps) {
  const {
    objectives,
    loading,
    error,
    createObjective,
    updateObjective,
    deleteObjective,
    activateObjective,
  } = useCustomObjectives(demoId);

  const [showForm, setShowForm] = useState(false);
  const [editingObjective, setEditingObjective] = useState<CustomObjective | null>(null);
  const [formData, setFormData] = useState<ObjectiveFormData>({
    name: '',
    description: '',
    objectives: [{ ...EMPTY_OBJECTIVE }],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      objectives: [{ ...EMPTY_OBJECTIVE }],
    });
    setEditingObjective(null);
    setShowForm(false);
  };

  const handleEdit = (objective: CustomObjective) => {
    setFormData({
      name: objective.name,
      description: objective.description || '',
      objectives: objective.objectives,
    });
    setEditingObjective(objective);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingObjective) {
        await updateObjective(editingObjective.id, formData);
      } else {
        await createObjective(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save objective:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this objective set?')) {
      try {
        await deleteObjective(id);
      } catch (error) {
        console.error('Failed to delete objective:', error);
      }
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateObjective(id);
    } catch (error) {
      console.error('Failed to activate objective:', error);
    }
  };

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

  if (loading && objectives.length === 0) {
    return <div className="text-center py-8">Loading custom objectives...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custom Demo Objectives</h3>
          <p className="text-sm text-gray-600">
            Create custom conversation flows for your agent to follow during demos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Objective Set
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Objectives List */}
      <div className="grid gap-4">
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className={`p-4 border rounded-lg ${
              objective.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{objective.name}</h4>
                  {objective.is_active && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                {objective.description && (
                  <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {objective.objectives.length} steps • Created {new Date(objective.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!objective.is_active && (
                  <button
                    onClick={() => handleActivate(objective.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Activate this objective set"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(objective)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                  title="Edit objective set"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(objective.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete objective set"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {objectives.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No custom objectives created yet.</p>
            <p className="text-sm">Create your first objective set to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingObjective ? 'Edit Objective Set' : 'Create New Objective Set'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                            value={obj.output_variables?.join(', ') || ''}
                            onChange={(e) => updateObjectiveStep(index, 'output_variables', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., user_name, company_name, interest_level"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
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
      )}
    </div>
  );
}