import { Demo } from '../types';

interface ConfigurationHeaderProps {
  demo: Demo | null;
  demoId: string;
}

export function ConfigurationHeader({
  demo,
  demoId,
}: ConfigurationHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configure: {demo?.name}
          </h1>
          <p className="text-sm text-gray-500">
            Manage your demo videos, knowledge base, and agent settings.
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href={`/demos/${demoId}/experience`}
            data-testid="view-demo-experience-button"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Demo Experience
          </a>
        </div>
      </div>
    </header>
  );
}
