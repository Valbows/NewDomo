'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Wrench } from 'lucide-react';

interface RavenDebugPanelProps {
  demoId?: string;
}

interface PersonaStatus {
  demo_id: string;
  demo_name: string;
  persona_id: string;
  persona_name?: string;
  perception_model: string | null;
  raven_enabled: boolean;
  has_conversation: boolean;
  needs_fix: boolean;
  error?: string;
}

const RavenDebugPanel: React.FC<RavenDebugPanelProps> = ({ demoId }) => {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [status, setStatus] = useState<PersonaStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-raven-config', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check status');
      }
      
      const data = await response.json();
      setStatus(data.demos);
      setLastCheck(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fixConfiguration = async (targetDemoId?: string, fixAll = false) => {
    setFixing(true);
    setError(null);
    
    try {
      const body: any = {};
      if (fixAll) {
        body.fixAll = true;
      } else if (targetDemoId) {
        body.demoId = targetDemoId;
      } else if (demoId) {
        body.demoId = demoId;
      }

      const response = await fetch('/api/fix-raven-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fix configuration');
      }
      
      const data = await response.json();
      
      // Refresh status after fixing
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFixing(false);
    }
  };

  const getStatusIcon = (persona: PersonaStatus) => {
    if (persona.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (persona.raven_enabled) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = (persona: PersonaStatus) => {
    if (persona.error) {
      return 'Error';
    }
    if (persona.raven_enabled) {
      return 'Raven-0 Enabled';
    }
    return 'Needs Configuration';
  };

  const summary = status ? {
    total: status.length,
    enabled: status.filter(s => s.raven_enabled).length,
    needsFix: status.filter(s => s.needs_fix).length,
    errors: status.filter(s => s.error).length,
  } : null;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Raven-0 Configuration Debug</h3>
          <p className="text-sm text-gray-600 mt-1">
            Check and fix persona configurations for perception analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Check Status
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {lastCheck && (
        <div className="mb-4 text-xs text-gray-500">
          Last checked: {lastCheck.toLocaleString()}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600 font-medium">Total Demos</div>
            <div className="text-lg font-bold text-gray-900">{summary.total}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600 font-medium">Raven-0 Enabled</div>
            <div className="text-lg font-bold text-green-800">{summary.enabled}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-xs text-yellow-600 font-medium">Needs Fix</div>
            <div className="text-lg font-bold text-yellow-800">{summary.needsFix}</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-xs text-red-600 font-medium">Errors</div>
            <div className="text-lg font-bold text-red-800">{summary.errors}</div>
          </div>
        </div>
      )}

      {summary && summary.needsFix > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-800">
                {summary.needsFix} persona(s) need raven-0 configuration
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Perception analysis requires perception_model to be set to 'raven-0'
              </div>
            </div>
            <button
              onClick={() => fixConfiguration(undefined, true)}
              disabled={fixing}
              className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {fixing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 mr-2" />
              )}
              Fix All
            </button>
          </div>
        </div>
      )}

      {status && status.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Demo Status</h4>
          {status.map((persona) => (
            <div key={persona.demo_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                {getStatusIcon(persona)}
                <div>
                  <div className="font-medium text-sm">{persona.demo_name}</div>
                  <div className="text-xs text-gray-500">
                    {persona.persona_name || persona.persona_id}
                  </div>
                  {persona.error && (
                    <div className="text-xs text-red-600 mt-1">{persona.error}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-700">
                    {getStatusText(persona)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Model: {persona.perception_model || 'not set'}
                  </div>
                  {persona.has_conversation && (
                    <div className="text-xs text-blue-600">Has conversation</div>
                  )}
                </div>
                {persona.needs_fix && !persona.error && (
                  <button
                    onClick={() => fixConfiguration(persona.demo_id)}
                    disabled={fixing}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {fixing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wrench className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {status && status.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <div className="text-sm">No demos with personas found</div>
          <div className="text-xs mt-1">Create a demo with a Domo persona to see status here</div>
        </div>
      )}
    </div>
  );
};

export default RavenDebugPanel;