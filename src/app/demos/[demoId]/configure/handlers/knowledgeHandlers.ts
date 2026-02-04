import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';
import type { KnowledgeChunk } from '../types';
import type { ModuleId } from '@/lib/modules/types';

export async function handleAddQAPair(
  newQuestion: string,
  newAnswer: string,
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setNewQuestion: (question: string) => void,
  setNewAnswer: (answer: string) => void,
  setError: (error: string | null) => void,
  moduleId?: ModuleId | null
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
        module_id: moduleId || null,
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
  setError: (error: string | null) => void,
  setIsUploading?: (uploading: boolean) => void,
  moduleId?: ModuleId | null
) {
  if (!knowledgeDoc) {
    setError('Please select a document to upload.');
    return;
  }
  setError(null);
  setIsUploading?.(true);

  try {
    const fileName = knowledgeDoc.name.toLowerCase();

    // For PDF and DOCX, use the server-side API
    if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      const formData = new FormData();
      formData.append('file', knowledgeDoc);

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse document');
      }

      const { content, source } = await response.json();

      if (!content || content.trim().length === 0) {
        setError('No content could be extracted from the document.');
        setIsUploading?.(false);
        return;
      }

      const { data: newChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
        demo_id: demoId,
        content: content,
        chunk_type: 'document',
        source: source,
        module_id: moduleId || null,
      }).select().single();

      if (insertError) throw insertError;
      if (!newChunk) throw new Error('Failed to upload document.');

      setKnowledgeChunks([...knowledgeChunks, newChunk]);
      setKnowledgeDoc(null);
      setIsUploading?.(false);
    } else {
      // For TXT files, read directly in browser
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (!content) {
          setError('File is empty or could not be read.');
          setIsUploading?.(false);
          return;
        }

        try {
          const { data: newChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
            demo_id: demoId,
            content: content,
            chunk_type: 'document',
            source: knowledgeDoc.name,
            module_id: moduleId || null,
          }).select().single();

          if (insertError) throw insertError;
          if (!newChunk) throw new Error('Failed to upload document.');

          setKnowledgeChunks([...knowledgeChunks, newChunk]);
          setKnowledgeDoc(null);
        } catch (err: unknown) {
          setError(getErrorMessage(err, 'Failed to upload document.'));
        } finally {
          setIsUploading?.(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setIsUploading?.(false);
      };
      reader.readAsText(knowledgeDoc);
    }
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to upload document.'));
    setIsUploading?.(false);
  }
}

export async function handleUrlImport(
  url: string,
  demoId: string,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setKnowledgeUrl: (url: string) => void,
  setError: (error: string | null) => void,
  setIsUploading?: (uploading: boolean) => void,
  moduleId?: ModuleId | null
) {
  if (!url.trim()) {
    setError('Please enter a URL.');
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    setError('Please enter a valid URL.');
    return;
  }

  setError(null);
  setIsUploading?.(true);

  try {
    const response = await fetch('/api/parse-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch URL content');
    }

    const { content, source } = await response.json();

    if (!content || content.trim().length === 0) {
      setError('No content could be extracted from the URL.');
      setIsUploading?.(false);
      return;
    }

    const { data: newChunk, error: insertError } = await supabase.from('knowledge_chunks').insert({
      demo_id: demoId,
      content: content,
      chunk_type: 'document',
      source: source,
      module_id: moduleId || null,
    }).select().single();

    if (insertError) throw insertError;
    if (!newChunk) throw new Error('Failed to import URL content.');

    setKnowledgeChunks([...knowledgeChunks, newChunk]);
    setKnowledgeUrl('');
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to import URL content.'));
  } finally {
    setIsUploading?.(false);
  }
}

/**
 * Update a knowledge chunk's module assignment
 */
export async function handleUpdateKnowledgeModule(
  chunkId: string,
  moduleId: ModuleId | null,
  knowledgeChunks: KnowledgeChunk[],
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void,
  setError: (error: string | null) => void
) {
  try {
    const { error } = await supabase
      .from('knowledge_chunks')
      .update({ module_id: moduleId })
      .eq('id', chunkId);

    if (error) throw error;

    setKnowledgeChunks(
      knowledgeChunks.map((c) =>
        c.id === chunkId ? { ...c, module_id: moduleId } : c
      )
    );
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to update knowledge module.'));
  }
}
