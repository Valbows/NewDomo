/**
 * Agent Management Hook
 *
 * Handles agent configuration and Tavus integration.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus';
import { Demo, KnowledgeChunk } from '../types';
import { getErrorMessage, logError } from '@/lib/errors';

export function useAgentManagement(
  demo: Demo | null,
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setUiState: (state: UIState) => void,
  setTavusPersonaId: (id: string | null) => void,
  setConversationData: (data: any) => void,
  setError: (error: string | null) => void
) {
  const [agentName, setAgentName] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('Friendly and helpful assistant.');
  const [agentGreeting, setAgentGreeting] = useState('Hello! How can I help you with the demo today?');
  const [objectives, setObjectives] = useState<string[]>(['', '', '']);

  // Initialize agent settings from demo data
  useEffect(() => {
    if (demo) {
      setAgentName(demo.metadata?.agentName || '');
      setAgentPersonality(demo.metadata?.agentPersonality || 'Friendly and helpful assistant.');
      setAgentGreeting(demo.metadata?.agentGreeting || 'Hello! How can I help you with the demo today?');
      
      // Initialize objectives: ensure 3–5 slots
      const rawObjectives: string[] = Array.isArray(demo.metadata?.objectives) 
        ? demo.metadata!.objectives! 
        : [];
      const trimmed = rawObjectives.filter((o) => typeof o === 'string').slice(0, 5);
      const padded = trimmed.length >= 3 
        ? trimmed 
        : [...trimmed, ...Array(Math.max(0, 3 - trimmed.length)).fill('')];
      setObjectives(padded);
    }
  }, [demo]);

  const createTavusAgent = async () => {
    if (!demo) {
      alert('Demo data is not loaded yet. Please wait a moment.');
      return;
    }
    
    setUiState(UIState.LOADING);
    
    try {
      const response = await fetch('/api/demos/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoId,
          agentName,
          agentPersonality,
          agentGreeting,
          knowledgeChunks,
        }),
      });

      const personaData = await response.json();
      setTavusPersonaId(personaData.personaId);

      // Start the conversation
      const convResponse = await fetch('/api/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personaId: personaData.personaId, 
          demoId: demo.id 
        }),
      });

      if (convResponse.ok) {
        const convData = await convResponse.json();
        setConversationData(convData);
        console.log('Conversation started:', convData);
        alert(`Conversation successfully created!\nID: ${convData.conversation_id}`);
      } else {
        const errorData = await convResponse.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      setUiState(UIState.IDLE);
    } catch (err: unknown) {
      logError(err, 'Agent creation error');
      setError(getErrorMessage(err, 'Failed to create agent.'));
      setUiState(UIState.IDLE);
    }
  };

  const saveAgentSettings = async () => {
    if (!demo) return;

    try {
      const updatedMetadata = {
        ...demo.metadata,
        agentName,
        agentPersonality,
        agentGreeting,
        objectives: objectives.filter(obj => obj.trim() !== ''),
      };

      const { error } = await supabase
        .from('demos')
        .update({ metadata: updatedMetadata })
        .eq('id', demoId);

      if (error) throw error;
      
      alert('Agent settings saved successfully!');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save agent settings.'));
    }
  };

  return {
    agentName,
    setAgentName,
    agentPersonality,
    setAgentPersonality,
    agentGreeting,
    setAgentGreeting,
    objectives,
    setObjectives,
    createTavusAgent,
    saveAgentSettings,
  };
}