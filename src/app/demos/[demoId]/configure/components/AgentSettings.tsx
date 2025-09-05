import { Demo } from '@/app/demos/[demoId]/configure/types';

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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Agent Settings</h2>
      <p className="text-gray-600 mb-6">Configure your Tavus agent's personality, appearance, and initial greeting.</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Demo Objectives (3–5)</label>
            <p className="text-xs text-gray-500 mb-2">These guide the agent to focus the conversation. Add 3–5 concise objectives.</p>
            <div className="space-y-2">
              {objectivesSafe.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    className="flex-1 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={`Objective ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    disabled={objectivesSafe.length <= 3}
                    className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                    title={objectivesSafe.length <= 3 ? 'Minimum 3 objectives required' : 'Remove objective'}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={addObjective}
                disabled={objectivesSafe.length >= 5}
                className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Objective
              </button>
              <span className="ml-2 text-xs text-gray-500">{objectivesSafe.length}/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
