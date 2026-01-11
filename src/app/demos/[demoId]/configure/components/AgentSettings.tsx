import { Demo } from '@/app/demos/[demoId]/configure/types';
import { DEFAULT_TEMPLATE_ID } from '@/lib/tavus/demo-objectives';
import { useState } from 'react';
import { DomoModal } from '@/components/DomoModal';

interface AgentSettingsProps {
  demo: Demo | null;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
  selectedObjectiveTemplate?: string;
  setSelectedObjectiveTemplate?: (templateId: string) => void;
  onAgentCreated?: () => void;
}

export const AgentSettings = ({
  demo,
  agentName,
  setAgentName,
  agentPersonality,
  setAgentPersonality,
  agentGreeting,
  setAgentGreeting,
  selectedObjectiveTemplate,
  setSelectedObjectiveTemplate,
  onAgentCreated,
}: AgentSettingsProps) => {
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentCreationResult, setAgentCreationResult] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Use the provided template or default
  const currentTemplate = selectedObjectiveTemplate || DEFAULT_TEMPLATE_ID;

  // Auto-select default template if none selected
  if (!selectedObjectiveTemplate && setSelectedObjectiveTemplate) {
    setSelectedObjectiveTemplate(DEFAULT_TEMPLATE_ID);
  }

  // Check if form is valid
  const isFormValid = agentName.trim() && currentTemplate;

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      return;
    }

    if (!demo?.id) {
      setErrorMessage('Demo not found. Please refresh the page and try again.');
      setShowErrorModal(true);
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

      // Notify parent that agent was created successfully
      if (result.success && onAgentCreated) {
        onAgentCreated();
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      setAgentCreationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-2">Agent Settings</h2>
      <p className="text-gray-600 mb-6">Configure your AI agent's identity and behavior.</p>

      <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-5">
        {/* Agent Name */}
        <div>
          <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-1">
            Agent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="agent-name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              !agentName.trim() ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
            }`}
            placeholder={demo?.name ? `${demo.name} Agent` : 'e.g., Sales Assistant'}
            required
          />
        </div>

        {/* Personality */}
        <div>
          <label htmlFor="agent-personality" className="block text-sm font-medium text-gray-700 mb-1">
            Personality <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="agent-personality"
            value={agentPersonality}
            onChange={(e) => setAgentPersonality(e.target.value)}
            rows={2}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Describe the agent's personality..."
          />
        </div>

        {/* Initial Greeting */}
        <div>
          <label htmlFor="agent-greeting" className="block text-sm font-medium text-gray-700 mb-1">
            Initial Greeting <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="agent-greeting"
            value={agentGreeting}
            onChange={(e) => setAgentGreeting(e.target.value)}
            rows={2}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Hello! How can I help you today?"
          />
        </div>

        {/* Result Message */}
        {agentCreationResult && (
          <div className={`p-3 rounded-md ${
            agentCreationResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {agentCreationResult.success ? (
              <p className="text-sm font-medium">Agent created successfully!</p>
            ) : (
              <div>
                <p className="text-sm font-medium">Failed to create agent</p>
                <p className="text-xs mt-1">{agentCreationResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Current Agent Status */}
        {demo?.tavus_persona_id && !agentCreationResult && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
            <p className="text-sm font-medium">Agent configured</p>
          </div>
        )}

        {/* Create Agent Button */}
        <button
          onClick={handleCreateAgent}
          disabled={isCreatingAgent || !isFormValid}
          className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreatingAgent ? 'Creating Agent...' : demo?.tavus_persona_id ? 'Update Agent' : 'Create Agent'}
        </button>
      </div>
      </div>

      {/* Error Modal */}
      <DomoModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        type="alert"
      />
    </>
  );
};
