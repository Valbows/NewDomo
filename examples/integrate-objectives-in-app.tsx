/**
 * Example: Integrating objectives into your Domo A.I. demo creation flow
 */

'use client';

import React, { useState } from 'react';
import { ObjectivesBuilder } from '@/components/features/objectives';
import { useObjectives } from '@/hooks';
import { createDomoAIPersona } from '@/lib/tavus';

export function DemoCreationWithObjectives() {
  const [step, setStep] = useState<'objectives' | 'persona' | 'complete'>('objectives');
  const [objectivesId, setObjectivesId] = useState<string>('');
  const [personaId, setPersonaId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { objectives } = useObjectives();

  const handleObjectivesCreated = (id: string) => {
    setObjectivesId(id);
    setStep('persona');
  };

  const handleCreatePersona = async () => {
    setLoading(true);
    try {
      const persona = await createDomoAIPersona({
        objectives_id: objectivesId,
        system_prompt: `You are Domo A.I., a structured demo assistant. Follow your objectives to guide users through a complete product demonstration.

Your objectives define the exact conversation flow you should follow. Complete each objective in order and collect all required information before moving to the next step.

Be natural and conversational while following the structured flow.`
      });
      
      setPersonaId(persona.persona_id);
      setStep('complete');
    } catch (error) {
      console.error('Failed to create persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingObjectives = (id: string) => {
    setObjectivesId(id);
    setStep('persona');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Structured Demo</h1>
        <p className="text-gray-600 mt-2">Build AI conversations that follow your business process</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step === 'objectives' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'objectives' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
          <span>Objectives</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${step === 'persona' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'persona' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
          <span>Persona</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
          <span>Complete</span>
        </div>
      </div>

      {/* Step 1: Objectives */}
      {step === 'objectives' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Choose Conversation Flow</h2>
            
            {/* Existing Objectives */}
            {objectives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Use Existing Objectives</h3>
                <div className="grid gap-3">
                  {objectives.slice(-3).map((obj) => (
                    <div
                      key={obj.uuid}
                      className="p-3 border rounded cursor-pointer hover:border-blue-500"
                      onClick={() => handleUseExistingObjectives(obj.uuid)}
                    >
                      <div className="font-medium">{obj.name || 'Unnamed Objectives'}</div>
                      <div className="text-sm text-gray-600">{obj.data?.length || 0} objectives</div>
                      <div className="text-xs text-gray-400">Created: {new Date(obj.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
                <div className="my-4 text-center text-gray-500">or</div>
              </div>
            )}

            {/* Create New Objectives */}
            <ObjectivesBuilder onObjectivesCreated={handleObjectivesCreated} />
          </div>
        </div>
      )}

      {/* Step 2: Persona */}
      {step === 'persona' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Step 2: Create AI Persona</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-800">✅ Objectives Ready</div>
                <div className="text-sm text-green-600">ID: {objectivesId}</div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium">Persona Configuration</label>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm">
                    <strong>System Prompt:</strong> Structured demo assistant with objectives
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Guardrails:</strong> Automatic safety rules
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Objectives:</strong> {objectivesId}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreatePersona}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {loading ? 'Creating Persona...' : 'Create AI Persona'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold mb-4">Demo Created Successfully!</h2>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium">Persona ID</div>
                <div className="text-sm font-mono">{personaId}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium">Objectives ID</div>
                <div className="text-sm font-mono">{objectivesId}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-sm text-gray-600">
                Your AI persona is now ready with structured conversation objectives!
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setStep('objectives');
                    setObjectivesId('');
                    setPersonaId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  Create Another
                </button>
                <button
                  onClick={() => {
                    // Navigate to conversation testing
                    window.open(`https://app.tavus.io/conversations/new?persona_id=${personaId}`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Test Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoCreationWithObjectives;