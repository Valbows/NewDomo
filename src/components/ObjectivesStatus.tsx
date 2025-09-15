'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useCustomObjectives } from '@/hooks/useCustomObjectives';

interface ObjectivesStatusProps {
  demoId: string;
}

export function ObjectivesStatus({ demoId }: ObjectivesStatusProps) {
  const { objectives, loading } = useCustomObjectives(demoId);
  
  const activeObjective = objectives.find(obj => obj.is_active);
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Settings className="w-4 h-4 animate-spin" />
        Loading objectives...
      </div>
    );
  }

  if (activeObjective) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            Active: {activeObjective.name}
          </p>
          <p className="text-xs text-green-600">
            {activeObjective.objectives.length} steps configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <AlertCircle className="w-4 h-4 text-yellow-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Using Default Objectives
        </p>
        <p className="text-xs text-yellow-600">
          Create custom objectives below for personalized demo flows
        </p>
      </div>
    </div>
  );
}