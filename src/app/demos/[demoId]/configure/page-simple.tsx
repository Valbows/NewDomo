'use client';

export default function SimpleConfigurationPage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Simple Configure: {demoId}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="flex border-b border-gray-200 bg-white">
            <button 
              value="videos" 
              className="px-6 py-3 text-sm font-medium text-indigo-600 border-b-2 border-indigo-500"
            >
              Videos
            </button>
            <button 
              value="knowledge" 
              className="px-6 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent"
            >
              Knowledge Base
            </button>
            <button 
              value="agent" 
              className="px-6 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent"
            >
              Agent Settings
            </button>
            <button 
              value="cta" 
              className="px-6 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent"
            >
              Call-to-Action
            </button>
            <button 
              value="reporting" 
              className="px-6 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent"
            >
              Reporting
            </button>
          </div>
          <div className="mt-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Videos Tab Content</h2>
              <p>This is a simple test to see if the page renders.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}