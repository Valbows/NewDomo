import { Demo } from '@/app/demos/[demoId]/configure/types';
import { DEFAULT_TEMPLATE_ID } from '@/lib/tavus/demo-objectives';
import { useState, useEffect } from 'react';
import { DomoModal } from '@/components/DomoModal';
import { ObjectiveTemplateSelector } from '@/components/ObjectiveTemplateSelector';

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
  isOnboarding?: boolean; // If true, only allow create, not update
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
  isOnboarding = false,
}: AgentSettingsProps) => {
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentCreationResult, setAgentCreationResult] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Use the provided template or default
  const currentTemplate = selectedObjectiveTemplate || DEFAULT_TEMPLATE_ID;

  // Auto-select default template if none selected (in useEffect to avoid setState during render)
  useEffect(() => {
    if (!selectedObjectiveTemplate && setSelectedObjectiveTemplate) {
      setSelectedObjectiveTemplate(DEFAULT_TEMPLATE_ID);
    }
  }, [selectedObjectiveTemplate, setSelectedObjectiveTemplate]);

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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create agent:', error);
      }
      // Show user-friendly error message, not technical details
      setAgentCreationResult({
        success: false,
        error: 'Failed to create agent. Please try again or contact support if the issue persists.'
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  // During onboarding, if agent already exists, show completed state
  const agentAlreadyExists = Boolean(demo?.tavus_persona_id);

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-white mb-2 font-heading">Agent Settings</h2>
        <p className="text-domo-text-secondary mb-6">Configure your AI agent's identity and behavior.</p>

        {/* During onboarding, if agent exists, just show success */}
        {isOnboarding && agentAlreadyExists ? (
          <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl max-w-2xl mx-auto">
            <div className="p-4 rounded-lg bg-domo-success/10 border border-domo-success/20 text-domo-success text-center">
              <p className="text-lg font-medium">Agent Created Successfully!</p>
              <p className="text-sm mt-2 opacity-80">You can update agent settings after completing the onboarding.</p>
            </div>
          </div>
        ) : (
          <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl max-w-2xl mx-auto space-y-5">
            {/* Agent Name */}
            <div>
              <label htmlFor="agent-name" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Agent Name <span className="text-domo-error">*</span>
              </label>
              <input
                type="text"
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className={`block w-full px-3 py-2.5 bg-domo-bg-dark border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm ${
                  !agentName.trim() ? 'border-amber-500/50 bg-amber-500/5' : 'border-domo-border'
                }`}
                placeholder={demo?.name ? `${demo.name} Agent` : 'e.g., Sales Assistant'}
                required
              />
            </div>

            {/* Personality */}
            <div>
              <label htmlFor="agent-personality" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Personality <span className="text-domo-text-muted text-xs">(optional)</span>
              </label>
              <textarea
                id="agent-personality"
                value={agentPersonality}
                onChange={(e) => setAgentPersonality(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="Describe the agent's personality..."
              />
            </div>

            {/* Initial Greeting */}
            <div>
              <label htmlFor="agent-greeting" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Initial Greeting <span className="text-domo-text-muted text-xs">(optional)</span>
              </label>
              <textarea
                id="agent-greeting"
                value={agentGreeting}
                onChange={(e) => setAgentGreeting(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="e.g., Hello! How can I help you today?"
              />
            </div>

            {/* Objective Template Selector */}
            {setSelectedObjectiveTemplate && (
              <ObjectiveTemplateSelector
                selectedTemplateId={currentTemplate}
                onSelect={setSelectedObjectiveTemplate}
              />
            )}

            {/* Result Message */}
            {agentCreationResult && (
              <div className={`p-3 rounded-lg ${
                agentCreationResult.success
                  ? 'bg-domo-success/10 border border-domo-success/20 text-domo-success'
                  : 'bg-domo-error/10 border border-domo-error/20 text-domo-error'
              }`}>
                {agentCreationResult.success ? (
                  <p className="text-sm font-medium">Agent created successfully!</p>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Failed to create agent</p>
                    <p className="text-xs mt-1 opacity-80">{agentCreationResult.error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Current Agent Status - only show outside onboarding */}
            {!isOnboarding && agentAlreadyExists && !agentCreationResult && (
              <div className="p-3 rounded-lg bg-domo-success/10 border border-domo-success/20 text-domo-success">
                <p className="text-sm font-medium">Agent configured</p>
              </div>
            )}

            {/* Create/Update Agent Button */}
            <button
              onClick={handleCreateAgent}
              disabled={isCreatingAgent || !isFormValid}
              className="w-full px-6 py-3 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingAgent
                ? 'Creating Agent...'
                : (!isOnboarding && agentAlreadyExists)
                  ? 'Update Agent'
                  : 'Create Agent'
              }
            </button>
          </div>
        )}
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
