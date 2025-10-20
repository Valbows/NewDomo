'use client';

import { useState } from 'react';

interface PersonaTestResult {
  success: boolean;
  verification?: any;
  analysis?: any;
  persona?: any;
  integration?: any;
  error?: string;
}

export default function TestPersonaPage() {
  const [demoId, setDemoId] = useState('bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    objectives?: PersonaTestResult;
    config?: PersonaTestResult;
    info?: PersonaTestResult;
  }>({});

  const testObjectives = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/verify-agent-objectives?demoId=${demoId}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, objectives: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, objectives: { success: false, error: String(error) } }));
    }
    setLoading(false);
  };

  const testConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/check-persona-config?demoId=${demoId}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, config: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, config: { success: false, error: String(error) } }));
    }
    setLoading(false);
  };

  const testInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get-persona-info?demoId=${demoId}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, info: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, info: { success: false, error: String(error) } }));
    }
    setLoading(false);
  };

  const testAll = async () => {
    await testObjectives();
    await testConfig();
    await testInfo();
  };

  const renderJson = (data: any) => (
    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Persona Configuration</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Demo Configuration</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo ID
              </label>
              <input
                type="text"
                value={demoId}
                onChange={(e) => setDemoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter demo ID"
              />
            </div>
            <button
              onClick={testAll}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test All'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Objectives Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Objectives Test</h3>
              <button
                onClick={testObjectives}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Test
              </button>
            </div>
            
            {results.objectives && (
              <div className="space-y-4">
                <div className={`p-3 rounded ${results.objectives.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.objectives.success ? '✅ Success' : '❌ Failed'}
                </div>
                
                {results.objectives.verification?.integration && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Integration Status:</h4>
                    <div className="text-sm space-y-1">
                      <div>Demo: {results.objectives.verification.integration.hasDemo ? '✅' : '❌'}</div>
                      <div>Persona: {results.objectives.verification.integration.hasPersona ? '✅' : '❌'}</div>
                      <div>System Prompt: {results.objectives.verification.integration.systemPromptConfigured ? '✅' : '❌'}</div>
                      <div>Guardrails: {results.objectives.verification.integration.guardrailsConfigured ? '✅' : '❌'}</div>
                      <div>Custom Objectives: {results.objectives.verification.integration.hasActiveCustomObjectives ? '✅' : '📋 Default'}</div>
                    </div>
                  </div>
                )}
                
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Full Response</summary>
                  {renderJson(results.objectives)}
                </details>
              </div>
            )}
          </div>

          {/* Config Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Config Test</h3>
              <button
                onClick={testConfig}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Test
              </button>
            </div>
            
            {results.config && (
              <div className="space-y-4">
                <div className={`p-3 rounded ${results.config.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.config.success ? '✅ Success' : '❌ Failed'}
                </div>
                
                {results.config.analysis && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Analysis:</h4>
                    <div className="text-sm space-y-1">
                      <div>Perception Analysis: {results.config.analysis.perception_analysis_enabled ? '✅ Enabled' : '❌ Disabled'}</div>
                      <div>Default Replica: {results.config.analysis.has_default_replica ? '✅ Set' : '❌ Not Set'}</div>
                      <div>Persona ID: {results.config.analysis.persona_id}</div>
                    </div>
                    
                    {results.config.analysis.recommendations?.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-medium text-orange-600">Recommendations:</h5>
                        <ul className="text-sm text-orange-700 list-disc list-inside">
                          {results.config.analysis.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Full Response</summary>
                  {renderJson(results.config)}
                </details>
              </div>
            )}
          </div>

          {/* Info Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Info Test</h3>
              <button
                onClick={testInfo}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Test
              </button>
            </div>
            
            {results.info && (
              <div className="space-y-4">
                <div className={`p-3 rounded ${results.info.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.info.success ? '✅ Success' : '❌ Failed'}
                </div>
                
                {results.info.persona && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Persona Info:</h4>
                    <div className="text-sm space-y-1">
                      <div>Name: {results.info.persona.name}</div>
                      <div>ID: {results.info.persona.id}</div>
                      <div>Guardrails ID: {results.info.persona.guardrailsId || 'Not set'}</div>
                      <div>Objectives ID: {results.info.persona.objectivesId || 'Not set'}</div>
                      <div>System Prompt: {results.info.persona.systemPromptLength} chars</div>
                    </div>
                  </div>
                )}
                
                {results.info.integration && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Integration:</h4>
                    <div className="text-sm space-y-1">
                      <div>System Prompt: {results.info.integration.systemPrompt ? '✅' : '❌'}</div>
                      <div>Guardrails: {results.info.integration.guardrails ? '✅' : '❌'}</div>
                      <div>Objectives: {results.info.integration.objectives ? '✅' : '❌'}</div>
                      <div>Custom Objectives: {results.info.integration.customObjectivesActive ? '✅' : '📋 Default'}</div>
                    </div>
                  </div>
                )}
                
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Full Response</summary>
                  {renderJson(results.info)}
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {(results.objectives || results.config || results.info) && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Objectives Status</h4>
                <div className={results.objectives?.success ? 'text-green-600' : 'text-red-600'}>
                  {results.objectives?.success ? '✅ Configured' : '❌ Issues Found'}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Config Status</h4>
                <div className={results.config?.success ? 'text-green-600' : 'text-red-600'}>
                  {results.config?.success ? '✅ Configured' : '❌ Issues Found'}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Info Status</h4>
                <div className={results.info?.success ? 'text-green-600' : 'text-red-600'}>
                  {results.info?.success ? '✅ Available' : '❌ Issues Found'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}