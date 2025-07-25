import { Demo } from '@/app/demos/[demoId]/configure/types';

interface AgentSettingsProps {
  demo: Demo | null;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
}

export const AgentSettings = ({ 
  demo,
  agentName, 
  setAgentName, 
  agentPersonality, 
  setAgentPersonality, 
  agentGreeting, 
  setAgentGreeting 
}: AgentSettingsProps) => {
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
        </div>
      </div>
    </div>
  );
};
