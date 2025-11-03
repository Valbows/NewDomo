import React from 'react';

export function renderTranscript(transcript: any) {
  if (!transcript)
    return <div className="text-sm text-gray-500">No transcript available</div>;
    
  // Handle array format (most common)
  if (Array.isArray(transcript)) {
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transcript.map((entry: any, index: number) => {
          // Handle different entry formats
          if (typeof entry === 'string') {
            return (
              <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
                <div className="text-xs font-medium text-gray-700">Unknown:</div>
                <div className="text-sm text-gray-800">{entry}</div>
              </div>
            );
          }
          
          if (typeof entry === 'object' && entry !== null) {
            const speaker = entry.speaker || entry.role || entry.user || "Unknown";
            const text = entry.text || entry.message || entry.content || 
                        (typeof entry.data === 'string' ? entry.data : '') ||
                        JSON.stringify(entry, null, 2);
            
            return (
              <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
                <div className="text-xs font-medium text-gray-700">{speaker}:</div>
                <div className="text-sm text-gray-800">{text}</div>
              </div>
            );
          }
          
          // Fallback for other types
          return (
            <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
              <div className="text-xs font-medium text-gray-700">Unknown:</div>
              <div className="text-sm text-gray-800">{String(entry)}</div>
            </div>
          );
        })}
      </div>
    );
  }
  
  // Handle object format (like Tavus API responses)
  if (typeof transcript === 'object' && transcript !== null) {
    // Check for common object structures
    if (transcript.entries && Array.isArray(transcript.entries)) {
      return renderTranscript(transcript.entries);
    }
    
    if (transcript.messages && Array.isArray(transcript.messages)) {
      return renderTranscript(transcript.messages);
    }
    
    if (transcript.conversation && Array.isArray(transcript.conversation)) {
      return renderTranscript(transcript.conversation);
    }
    
    // If it's an object but not a recognized format, display as formatted JSON
    try {
      const formattedJson = JSON.stringify(transcript, null, 2);
      return (
        <div className="text-sm text-gray-800 bg-gray-50 rounded p-4">
          <div className="font-medium text-gray-600 mb-2">Transcript Data:</div>
          <pre className="whitespace-pre-wrap text-xs">{formattedJson}</pre>
        </div>
      );
    } catch (error) {
      return (
        <div className="text-sm text-gray-500 bg-gray-50 rounded p-4">
          Unable to display transcript data (parsing error)
        </div>
      );
    }
  }
  
  // Handle string format
  if (typeof transcript === 'string') {
    return (
      <div className="text-sm text-gray-800 bg-gray-50 rounded p-4">
        {transcript}
      </div>
    );
  }
  
  // Fallback for any other type
  return (
    <div className="text-sm text-gray-500 bg-gray-50 rounded p-4">
      Transcript format not recognized: {typeof transcript}
    </div>
  );
}

export function renderPerceptionAnalysis(perception: any) {
  if (!perception)
    return (
      <div className="text-sm text-gray-500">
        No perception analysis available
      </div>
    );
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
      <div className="text-sm text-gray-700 whitespace-pre-wrap">
        {String(perception)}
      </div>
    </div>
  );
}