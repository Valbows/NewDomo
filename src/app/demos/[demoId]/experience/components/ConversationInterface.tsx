import {TavusConversationCVI} from './TavusConversationCVI';
import {UIState} from '@/lib/tavus';

interface ConversationInterfaceProps {
  conversationUrl: string | null;
  uiState: UIState;
  onLeave: () => void;
  onToolCall: (toolName: string, args: any) => Promise<void>;
  debugVideoTitles: string[];
  onExpandConversation: () => void;
  onConversationEnd?: () => void;
}

export function ConversationInterface({
  conversationUrl,
  uiState,
  onLeave,
  onToolCall,
  debugVideoTitles,
  onExpandConversation,
  onConversationEnd,
}: ConversationInterfaceProps) {
  return (
    <div
      data-testid="conversation-container"
      data-pip={uiState === UIState.VIDEO_PLAYING ? 'true' : 'false'}
      className={`${
        uiState === UIState.VIDEO_PLAYING 
          ? 'fixed bottom-4 right-4 w-96 h-72 z-50 shadow-2xl' 
          : 'w-full h-full flex items-center justify-center p-4'
      } transition-all duration-300`}
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full h-full flex flex-col">
        <div className="p-2 bg-indigo-600 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className={`font-semibold ${
              uiState === UIState.VIDEO_PLAYING ? 'text-sm' : 'text-lg'
            }`}>AI Demo Assistant</h2>
            {uiState !== UIState.VIDEO_PLAYING && (
              <p className="text-indigo-100 text-sm">Ask questions and request to see specific features</p>
            )}
          </div>
          {uiState === UIState.VIDEO_PLAYING && (
            <button
              data-testid="button-expand-conversation"
              onClick={onExpandConversation}
              className="text-white hover:text-indigo-200 p-1"
              title="Expand conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
        <div className="relative bg-gray-900 flex-1" style={{
          height: uiState === UIState.VIDEO_PLAYING ? '250px' : '75vh',
          minHeight: '400px'
        }}>
          {conversationUrl ? (
            <div className={uiState === UIState.VIDEO_PLAYING ? 'pip-video-layout' : ''}>
              <TavusConversationCVI
                conversationUrl={conversationUrl}
                onLeave={onLeave}
                onToolCall={onToolCall}
                debugVideoTitles={debugVideoTitles}
                onConversationEnd={onConversationEnd}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              Connecting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}