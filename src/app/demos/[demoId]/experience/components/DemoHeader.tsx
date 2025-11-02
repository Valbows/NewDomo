interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
  metadata: any;
}

interface DemoHeaderProps {
  demo: Demo | null;
  demoId: string;
  onNavigateToConfig: () => void;
}

export function DemoHeader({ demo, demoId, onNavigateToConfig }: DemoHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{demo?.name}</h1>
            <p className="text-gray-600">Interactive Demo Experience</p>
          </div>
          <button
            onClick={onNavigateToConfig}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Configure Demo
          </button>
        </div>
      </div>
    </header>
  );
}