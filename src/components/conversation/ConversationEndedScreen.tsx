'use client';

interface ConversationEndedScreenProps {
  onRestart?: () => void;
  restartLabel?: string;
}

/**
 * Shared screen shown when conversation ends.
 */
export function ConversationEndedScreen({
  onRestart,
  restartLabel = 'Start New Conversation',
}: ConversationEndedScreenProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-6xl mb-4">👋</div>
      <h2 className="text-2xl font-bold mb-2">Thanks for chatting!</h2>
      <p className="text-gray-400 mb-6 text-center">
        We hope you enjoyed the demo. Ready to take the next step?
      </p>
      {onRestart && (
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          {restartLabel}
        </button>
      )}
    </div>
  );
}
