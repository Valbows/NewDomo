import { VideoShowcaseData } from "../../types";
import { formatDate } from "../../utils/formatters";

interface VideoShowcaseCardProps {
  videoShowcase: VideoShowcaseData | null;
}

export function VideoShowcaseCard({ videoShowcase }: VideoShowcaseCardProps) {
  const hasMeaningfulData = !!(videoShowcase?.videos_shown && videoShowcase.videos_shown.length > 0);

  // Don't show the card at all if no meaningful data
  if (!hasMeaningfulData) {
    return null;
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
        <div>
          <span className="text-xs font-medium text-purple-700">Videos Viewed:</span>
          <ul className="mt-1 space-y-1">
            {videoShowcase!.videos_shown!.map((video, index) => (
              <li
                key={index}
                className="text-sm text-purple-900 flex items-start gap-2"
              >
                <span className="text-purple-600 mt-1">🎥</span>
                <span className="font-medium">{video}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className="text-xs font-medium text-purple-700">Captured:</span>
          <p className="text-xs text-purple-600">
            {formatDate(videoShowcase!.received_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
