import { Demo } from '@/app/demos/[demoId]/configure/types';
import { CustomObjectivesManager } from '@/components/CustomObjectivesManager';
import { ObjectivesStatus } from '@/components/ObjectivesStatus';
import WebhookUrlDisplay from '@/components/WebhookUrlDisplay';
import { useState } from 'react';

interface AgentSettingsProps {
  demo: Demo | null;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
  objectives?: string[];
  setObjectives?: (objectives: string[]) => void;
}

export const AgentSettings = ({ 
  demo,
  agentName, 
  setAgentName, 
  agentPersonality, 
  setAgentPersonality, 
  agentGreeting, 
  setAgentGreeting,
  objectives,
  setObjectives
}: AgentSettingsProps) => {
  // Provide safe fallbacks if objectives props are omitted (e.g., in tests)
  const objectivesSafe: string[] = Array.isArray(objectives)
    ? objectives
    : (Array.isArray(demo?.metadata?.objectives) && (demo!.metadata!.objectives as string[])) || ['', '', ''];
  const setObjectivesSafe = typeof setObjectives === 'function' ? setObjectives : (_: string[]) => {};

  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentCreationResult, setAgentCreationResult] = useState<any>(null);

  const handleObjectiveChange = (index: number, value: string) => {
    const next = [...objectivesSafe];
    next[index] = value;
    setObjectivesSafe(next);
  };

  const addObjective = () => {
    if (objectivesSafe.length >= 5) return;
    setObjectivesSafe([...objectivesSafe, '']);
  };

  const removeObjective = (index: number) => {
    if (objectivesSafe.length <= 3) return; // enforce minimum of 3
    const next = objectivesSafe.filter((_, i) => i !== index);
    setObjectivesSafe(next);
  };

  const handleCreateEnhancedAgent = async () => {
    if (!demo?.id || !agentName.trim()) {
      alert('Please fill in the agent name');
      return;
    }

    setIsCreatingAgent(true);
    setAgentCreationResult(null);

    try {
      const response = await fetch('/api/create-enhanced-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoId: demo.id,
          agentName: agentName.trim(),
          agentPersonality: agentPersonality.trim(),
          agentGreeting: agentGreeting.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create agent: ${error}`);
      }

      const result = await response.json();
      setAgentCreationResult(result);
      
      console.log('🎉 Enhanced agent created successfully!', result);
      
    } catch (error) {
      console.error('❌ Failed to create enhanced agent:', error);
      setAgentCreationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Agent Settings</h2>
      <p className="text-gray-600 mb-6">Configure your Domo agent's personality, appearance, and initial greeting.</p>
      <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700">Agent Name</label>
            <input
              type="text"
              id="agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={demo?.name ? `${demo.name} Agent` : 'e.g., Sales Assistant'}
            />
          </div>
          <div>
            <label htmlFor="agent-personality" className="block text-sm font-medium text-gray-700">Personality</label>
            <textarea
              id="agent-personality"
              value={agentPersonality}
              onChange={(e) => setAgentPersonality(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Describe the agent's personality..."
            ></textarea>
          </div>
          <div>
            <label htmlFor="agent-greeting" className="block text-sm font-medium text-gray-700">Initial Greeting</label>
            <textarea
              id="agent-greeting"
              value={agentGreeting}
              onChange={(e) => setAgentGreeting(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Hello! How can I help you today?"
            ></textarea>
          </div>
          {/* Demo Objectives Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Demo Objectives</label>
            
            {/* Override Behavior Notice */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">
                🎯 Objectives Priority System
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Custom objectives will <strong>always override</strong> default template objectives when active. 
                Default templates are only used when no custom objectives are set.
              </p>
            </div>
            
            {/* Objectives Status */}
            <div className="mb-4">
              <ObjectivesStatus demoId={demo?.id || ''} />
            </div>

            {/* Custom Objectives Manager */}
            <CustomObjectivesManager demoId={demo?.id || ''} />
          </div>

          {/* Webhook URL Display */}
          <div>
            <WebhookUrlDisplay className="mb-4" />
          </div>

          {/* Agent Creation */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Create New Agent</h3>
            <p className="text-sm text-blue-700 mb-4">
              Creates a new Tavus persona with the current settings. Each time you click this button, a completely new agent will be created with a new persona ID, preserving your previous agents.
            </p>
            
            {/* Show current agent status */}
            {demo?.tavus_persona_id && !agentCreationResult && (
              <div className="mb-4 p-3 rounded bg-green-100 border border-green-300 text-green-800">
                <p className="font-medium">✅ Current Agent</p>
                <p className="text-sm mt-1">Persona ID: {demo.tavus_persona_id}</p>
                <p className="text-sm">Creating a new agent will generate a new persona ID and preserve this one.</p>
              </div>
            )}
            
            {agentCreationResult && (
              <div className={`mb-4 p-3 rounded ${
                agentCreationResult.success 
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                {agentCreationResult.success ? (
                  <div>
                    <p className="font-medium">✅ Agent Created Successfully!</p>
                    <p className="text-sm mt-1">Persona ID: {agentCreationResult.personaId}</p>
                    <p className="text-sm">System Prompt ✅ Guardrails ✅ Objectives ✅</p>
                    {agentCreationResult.configuration?.customObjectives && (
                      <p className="text-sm">Custom Objectives: {agentCreationResult.configuration.customObjectives.name} ({agentCreationResult.configuration.customObjectives.steps} steps) ✅</p>
                    )}
                    <p className="text-sm mt-2 font-medium">🚀 Ready to test! Go to the Experience tab and start a conversation.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">❌ Agent Creation Failed</p>
                    <p className="text-sm mt-1">{agentCreationResult.error}</p>
                    {agentCreationResult.error?.includes('Failed to verify Domo persona') && (
                      <p className="text-sm mt-2 text-red-600">
                        This might be a temporary Domo API issue. Please try again in a moment.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCreateEnhancedAgent}
              disabled={isCreatingAgent || !agentName.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingAgent ? 'Creating New Agent...' : 'Create New Agent'}
            </button>
            
            <div className="mt-3 text-xs text-blue-600">
              <p>✅ Always creates a new persona with new ID</p>
              <p>✅ System Prompt + Guardrails always included</p>
              <p>✅ Uses custom objectives if active, otherwise default objectives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
