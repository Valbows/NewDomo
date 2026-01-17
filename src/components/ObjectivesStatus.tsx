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
      <div className="flex items-center gap-2 text-sm text-domo-text-muted">
        <Settings className="w-4 h-4 animate-spin" />
        Loading objectives...
      </div>
    );
  }

  if (activeObjective) {
    return (
      <div className="flex items-center gap-2 p-3 bg-domo-success/10 border border-domo-success/20 rounded-md">
        <CheckCircle className="w-4 h-4 text-domo-success" />
        <div className="flex-1">
          <p className="text-sm font-medium text-domo-success">
            Active: {activeObjective.name}
          </p>
          <p className="text-xs text-domo-success/80">
            {activeObjective.objectives.length} steps configured • Overriding default objectives
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
      <AlertCircle className="w-4 h-4 text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-400">
          Using Default Template Objectives
        </p>
        <p className="text-xs text-amber-400/80">
          Create custom objectives below to override defaults with personalized flows
        </p>
      </div>
    </div>
  );
}
