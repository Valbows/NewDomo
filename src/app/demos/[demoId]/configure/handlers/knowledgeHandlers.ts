import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import type { KnowledgeChunk } from '../types';

export async function handleAddQAPair(
  newQuestion: string,
  newAnswer: string,
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setNewQuestion: (question: string) => void,
  setNewAnswer: (answer: string) => void,
  setError: (error: string | null) => void
) {
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
}

export async function handleDeleteKnowledgeChunk(
  id: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setError: (error: string | null) => void
) {
  try {
    const { error } = await supabase.from('knowledge_chunks').delete().eq('id', id);
    if (error) throw error;
    setKnowledgeChunks(knowledgeChunks.filter(chunk => chunk.id !== id));
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to delete knowledge chunk.'));
  }
}

export async function handleKnowledgeDocUpload(
  knowledgeDoc: File | null,
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setKnowledgeDoc: (doc: File | null) => void,
  setError: (error: string | null) => void
) {
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

      const { data: newChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
        demo_id: demoId,
        content: content,
        chunk_type: 'document',
        source: knowledgeDoc.name
      }).select().single();

      if (insertError) throw insertError;
      if (!newChunk) throw new Error('Failed to upload document.');

      setKnowledgeChunks([...knowledgeChunks, newChunk]);
      setKnowledgeDoc(null);
    };
    reader.readAsText(knowledgeDoc);
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to upload document.'));
  }
}
