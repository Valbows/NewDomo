import { Plus, Trash2, Upload } from 'lucide-react';
import { KnowledgeChunk } from '@/app/demos/[demoId]/configure/types';
import React from 'react';

interface KnowledgeBaseManagementProps {
  knowledgeChunks: KnowledgeChunk[];
  newQuestion: string;
  setNewQuestion: (question: string) => void;
  newAnswer: string;
  setNewAnswer: (answer: string) => void;
  handleAddQAPair: () => void;
  handleDeleteKnowledgeChunk: (id: string) => void;
  knowledgeDoc: File | null;
  setKnowledgeDoc: (file: File | null) => void;
  handleKnowledgeDocUpload: () => void;
}

export const KnowledgeBaseManagement = ({ 
  knowledgeChunks, 
  newQuestion, 
  setNewQuestion, 
  newAnswer, 
  setNewAnswer, 
  handleAddQAPair, 
  handleDeleteKnowledgeChunk,
  knowledgeDoc,
  setKnowledgeDoc,
  handleKnowledgeDocUpload
}: KnowledgeBaseManagementProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Knowledge Base</h2>
      <p className="text-gray-600 mb-6">Review transcripts, upload documents, and add custom Q&A pairs to train your agent.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Existing Knowledge</h3>
          <ul className="space-y-3 h-96 overflow-y-auto">
            {knowledgeChunks.map(chunk => {
              let content;
              if (chunk.chunk_type === 'qa' && typeof chunk.content === 'string') {
                // Q&A content is stored as "Q: question\nA: answer" format
                content = <p className="whitespace-pre-wrap">{chunk.content}</p>;
              } else {
                content = <p className="whitespace-pre-wrap">{chunk.content}</p>;
              }
              return (
                <li key={chunk.id} className="p-3 rounded-md border border-gray-200 flex items-start justify-between">
                  <div className="text-sm flex-grow">
                    <span className="font-bold capitalize">{chunk.chunk_type.replace('_', ' ')}:</span>
                    {content}
                  </div>
                  <button onClick={() => handleDeleteKnowledgeChunk(chunk.id)} className="text-red-500 hover:text-red-700 ml-4 flex-shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
            {knowledgeChunks.length === 0 && (
              <li className="text-center text-sm text-gray-500 p-4">No knowledge chunks yet.</li>
            )}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="doc-upload" className="block text-sm font-medium text-gray-700">Upload a .txt file</label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="doc-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="doc-upload" name="doc-upload" type="file" className="sr-only" onChange={(e) => setKnowledgeDoc(e.target.files ? e.target.files[0] : null)} accept=".txt" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">Only .txt files are supported.</p>
                    {knowledgeDoc && <p className="text-sm text-gray-900 mt-2">Selected: {knowledgeDoc.name}</p>}
                  </div>
                </div>
              </div>
              <button
                onClick={handleKnowledgeDocUpload}
                disabled={!knowledgeDoc}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                <Upload className="-ml-1 mr-2 h-5 w-5" />
                Upload Document
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Add Q&A Pair</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">Question</label>
                <input
                  type="text"
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., What is the pricing?"
                />
              </div>
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700">Answer</label>
                <textarea
                  id="answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Provide a detailed answer..."
                ></textarea>
              </div>
              <button
                onClick={handleAddQAPair}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Q&A Pair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
