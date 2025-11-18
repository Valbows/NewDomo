import { PerceptionMetrics } from "../types";

export function SafeJSON({ value }: { value: any }) {
  return (
    <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-64 border border-gray-200">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

export function renderTranscript(transcript: any) {
  if (!transcript) {
    return (
      <div className="text-sm text-gray-500">No transcript available</div>
    );
  }

  // Handle different transcript formats from Tavus
  if (Array.isArray(transcript)) {
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transcript.map((entry: any, index: number) => {
          // Handle different entry formats
          const speaker = entry.speaker || entry.role || "Unknown";
          const text = entry.text || entry.content || String(entry);
          const timestamp = entry.timestamp || entry.created_at || null;

          return (
            <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
              {timestamp && (
                <div className="text-xs text-gray-500 font-mono whitespace-nowrap">
                  {new Date(timestamp * 1000).toLocaleTimeString()}
                </div>
              )}
              <div className="text-xs font-medium text-gray-700 capitalize">
                {speaker}:
              </div>
              <div className="text-sm text-gray-800 flex-1 whitespace-pre-wrap">
                {text.length > 200 ? `${text.substring(0, 200)}...` : text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // If transcript is a string or other format, display it as-is
  return (
    <div className="text-sm text-gray-800 bg-gray-50 rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
      {String(transcript)}
    </div>
  );
}

export function renderPerceptionAnalysis(perception: any) {
  if (!perception) {
    return (
      <div className="text-sm text-gray-500">
        No perception analysis available
      </div>
    );
  }

  // If perception is structured metrics object
  if (
    typeof perception === "object" &&
    !Array.isArray(perception) &&
    perception.overall_score
  ) {
    const metrics = perception as PerceptionMetrics;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600 font-medium">
              Overall Score
            </div>
            <div className="text-lg font-bold text-blue-800">
              {metrics.overall_score
                ? `${Math.round(metrics.overall_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600 font-medium">
              Engagement
            </div>
            <div className="text-lg font-bold text-green-800">
              {metrics.engagement_score
                ? `${Math.round(metrics.engagement_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600 font-medium">
              Sentiment
            </div>
            <div className="text-lg font-bold text-purple-800">
              {metrics.sentiment_score
                ? `${Math.round(metrics.sentiment_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-orange-600 font-medium">
              Interest Level
            </div>
            <div className="text-sm font-bold text-orange-800 capitalize">
              {metrics.interest_level || "—"}
            </div>
          </div>
        </div>

        {metrics.key_insights && metrics.key_insights.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Key Insights
            </div>
            <ul className="space-y-1">
              {metrics.key_insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // If perception is a text analysis (like from Tavus), display it nicely
  if (typeof perception === "string") {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-blue-600">🧠</span>
            Visual & Behavioral Analysis
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {perception}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600 font-medium">
              Analysis Type
            </div>
            <div className="text-sm font-bold text-blue-800">
              Visual Perception
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600 font-medium">Duration</div>
            <div className="text-sm font-bold text-green-800">60 minutes</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600 font-medium">
              Data Source
            </div>
            <div className="text-sm font-bold text-purple-800">Domo AI</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-orange-600 font-medium">Status</div>
            <div className="text-sm font-bold text-orange-800">Complete</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other formats
  return (
    <div className="text-sm text-gray-800 bg-gray-50 rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
      {JSON.stringify(perception, null, 2)}
    </div>
  );
}
