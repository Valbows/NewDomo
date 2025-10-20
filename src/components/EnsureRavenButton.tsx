'use client';

import React, { useState } from 'react';
import { Loader2, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

interface EnsureRavenButtonProps {
  className?: string;
  variant?: 'button' | 'card';
}

const EnsureRavenButton: React.FC<EnsureRavenButtonProps> = ({ 
  className = '', 
  variant = 'button' 
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureRavenPerception = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check status
      const checkResponse = await fetch('/api/ensure-raven-perception', {
        method: 'GET',
      });
      
      if (!checkResponse.ok) {
        throw new Error('Failed to check perception status');
      }
      
      const checkData = await checkResponse.json();
      
      // If all are already enabled, just show status
      if (checkData.summary.total === checkData.summary.already_enabled) {
        setStatus({
          ...checkData.summary,
          message: 'All personas already have raven-0 enabled!'
        });
        return;
      }
      
      // Update personas that need it
      const updateResponse = await fetch('/api/ensure-raven-perception', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Update all personas
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update personas');
      }
      
      const updateData = await updateResponse.json();
      setStatus(updateData.summary);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-100 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Perception Analysis</h3>
          </div>
          {status && (
            <div className="flex items-center gap-1 text-sm">
              {status.failed > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-gray-600">
                {status.total} persona{status.total !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          Ensure all your personas have raven-0 enabled for perception analysis
        </p>
        
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        {status && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="font-medium text-blue-800 mb-1">
              {status.message || 'Update completed'}
            </div>
            <div className="text-blue-700 text-xs">
              ✅ {status.already_enabled + (status.successfully_updated || 0)} enabled • 
              {status.failed > 0 && ` ❌ ${status.failed} failed`}
            </div>
          </div>
        )}
        
        <button
          onClick={ensureRavenPerception}
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Checking...' : 'Ensure Raven-0'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={ensureRavenPerception}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Eye className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Updating...' : 'Ensure Raven-0'}
    </button>
  );
};

export default EnsureRavenButton;