import React, { useState } from 'react';

const CreateDemoPage: React.FC = () => {
  const [demoName, setDemoName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demoName.trim()) {
      setError('Demo name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Simulate demo creation
      const response = await fetch('/api/demos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: demoName.trim(),
          fileName: demoName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create demo');
      }

      const demo = await response.json();
      // Simulate redirect
      console.log(`Redirecting to /demos/${demo.id}/configure`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create demo');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6" data-testid="create-demo-page">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Demo</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="demo-name" className="block text-sm font-medium text-gray-700 mb-2">
              Demo Name
            </label>
            <input
              id="demo-name"
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              placeholder="Enter demo name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              data-testid="demo-name-input"
              disabled={isCreating}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4" data-testid="error-message">
              <div className="flex">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!demoName.trim() || isCreating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              data-testid="create-demo-button"
            >
              {isCreating ? 'Creating...' : 'Create and Configure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDemoPage;