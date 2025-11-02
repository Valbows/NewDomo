interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  requested_videos: string[] | null;
  videos_shown: string[] | null;
  objective_name: string;
  received_at: string;
}

function formatDate(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : "—";
  } catch {
    return "—";
  }
}

export function VideoShowcaseCard({ videoShowcase }: { videoShowcase: VideoShowcaseData | null }) {
  if (!videoShowcase) {
    return (
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          🎬 Website Feature They Are Most Interested in Viewing
        </h5>
        <p className="text-sm text-gray-500">No video showcase data captured for this conversation</p>
      </div>
    );
  }
  
  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
        🎬 Website Feature They Are Most Interested in Viewing
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Captured
        </span>
      </h5>
      <div className="space-y-4">
        {videoShowcase.requested_videos && videoShowcase.requested_videos.length > 0 && (
          <div>
            <span className="text-xs font-medium text-purple-700">Videos Requested:</span>
            <ul className="mt-1 space-y-1">
              {videoShowcase.requested_videos.map((video, index) => (
                <li key={index} className="text-sm text-purple-900 flex items-start gap-2">
                  <span className="text-purple-600 mt-1">🎥</span>
                  <span className="font-medium">{video}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {videoShowcase.videos_shown && videoShowcase.videos_shown.length > 0 && (
          <div>
            <span className="text-xs font-medium text-purple-700">Videos Actually Shown:</span>
            <ul className="mt-1 space-y-1">
              {videoShowcase.videos_shown.map((video, index) => (
                <li key={index} className="text-sm text-purple-900 flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✅</span>
                  <span>{video}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {(!videoShowcase.requested_videos || videoShowcase.requested_videos.length === 0) && 
         (!videoShowcase.videos_shown || videoShowcase.videos_shown.length === 0) && (
          <div>
            <span className="text-xs font-medium text-purple-700">Status:</span>
            <p className="text-sm text-purple-900 mt-1">
              Video showcase objective completed but no specific videos were captured
            </p>
          </div>
        )}
        
        <div>
          <span className="text-xs font-medium text-purple-700">Captured:</span>
          <p className="text-xs text-purple-600">
            {formatDate(videoShowcase.received_at)}
          </p>
        </div>
      </div>
    </div>
  );
}