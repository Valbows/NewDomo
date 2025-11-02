/**
 * Knowledge Management Hook
 *
 * Handles knowledge base operations (Q&A pairs, document uploads).
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KnowledgeChunk } from '../types';
import { getErrorMessage } from '@/lib/errors';

export function useKnowledgeManagement(
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setError: (error: string | null) => void
) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [knowledgeDoc, setKnowledgeDoc] = useState<File | null>(null);

  const handleAddQAPair = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setError('Please provide both a question and an answer.');
      return;
    }
    setError(null);

    try {
      const { data: newChunk, error } = await supabase
        .from('knowledge_chunks')
        .insert({
          demo_id: demoId,
          content: `Q: ${newQuestion}\nA: ${newAnswer}`,
          chunk_type: 'qa',
        })
        .select()
        .single();

      if (error) throw error;
      if (!newChunk) throw new Error('Failed to add Q&A pair.');

      setKnowledgeChunks([...knowledgeChunks, newChunk]);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to add Q&A pair.'));
    }
  };

  const handleDeleteKnowledgeChunk = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setKnowledgeChunks(knowledgeChunks.filter(chunk => chunk.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete knowledge chunk.'));
    }
  };

  const handleKnowledgeDocUpload = async () => {
    if (!knowledgeDoc) {
      setError('Please select a document to upload.');
      return;
    }
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (!content) {
          setError('File is empty or could not be read.');
          return;
        }

        const { data: newChunk, error: insertError } = await supabase
          .from('knowledge_chunks')
          .insert({
            demo_id: demoId,
            content: content,
            chunk_type: 'document',
            source: knowledgeDoc.name
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newChunk) throw new Error('Failed to upload document.');
        
        setKnowledgeChunks([...knowledgeChunks, newChunk]);
        setKnowledgeDoc(null);
      };
      reader.readAsText(knowledgeDoc);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to upload document.'));
    }
  };

  return {
    newQuestion,
    setNewQuestion,
    newAnswer,
    setNewAnswer,
    knowledgeDoc,
    setKnowledgeDoc,
    handleAddQAPair,
    handleDeleteKnowledgeChunk,
    handleKnowledgeDocUpload,
  };
}