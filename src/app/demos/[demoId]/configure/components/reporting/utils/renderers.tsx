import { PerceptionMetrics } from "../types";

export function SafeJSON({ value }: { value: any }) {
  return (
    <pre className="text-xs bg-domo-bg-elevated rounded p-3 overflow-auto max-h-64 border border-domo-border text-domo-text-secondary">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

export function renderTranscript(transcript: any) {
  if (!transcript) {
    return (
      <div className="text-sm text-domo-text-muted">No transcript available</div>
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
            <div key={index} className="flex gap-3 p-2 rounded bg-domo-bg-elevated">
              {timestamp && (
                <div className="text-xs text-domo-text-muted font-mono whitespace-nowrap">
                  {new Date(timestamp * 1000).toLocaleTimeString()}
                </div>
              )}
              <div className="text-xs font-medium text-domo-text-secondary capitalize">
                {speaker}:
              </div>
              <div className="text-sm text-white flex-1 whitespace-pre-wrap">
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
    <div className="text-sm text-white bg-domo-bg-elevated rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
      {String(transcript)}
    </div>
  );
}

export function renderPerceptionAnalysis(perception: any) {
  if (!perception) {
    return (
      <div className="text-sm text-domo-text-muted">
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
          <div className="bg-domo-primary/10 p-3 rounded">
            <div className="text-xs text-domo-primary font-medium">
              Overall Score
            </div>
            <div className="text-lg font-bold text-domo-primary">
              {metrics.overall_score
                ? `${Math.round(metrics.overall_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-domo-success/10 p-3 rounded">
            <div className="text-xs text-domo-success font-medium">
              Engagement
            </div>
            <div className="text-lg font-bold text-domo-success">
              {metrics.engagement_score
                ? `${Math.round(metrics.engagement_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-purple-500/10 p-3 rounded">
            <div className="text-xs text-purple-400 font-medium">
              Sentiment
            </div>
            <div className="text-lg font-bold text-purple-400">
              {metrics.sentiment_score
                ? `${Math.round(metrics.sentiment_score * 100)}%`
                : "—"}
            </div>
          </div>
          <div className="bg-amber-500/10 p-3 rounded">
            <div className="text-xs text-amber-400 font-medium">
              Interest Level
            </div>
            <div className="text-sm font-bold text-amber-400 capitalize">
              {metrics.interest_level || "—"}
            </div>
          </div>
        </div>

        {metrics.key_insights && metrics.key_insights.length > 0 && (
          <div>
            <div className="text-sm font-medium text-domo-text-secondary mb-2">
              Key Insights
            </div>
            <ul className="space-y-1">
              {metrics.key_insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-sm text-domo-text-secondary flex items-start gap-2"
                >
                  <span className="text-domo-primary mt-1">•</span>
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
        <div className="bg-gradient-to-r from-domo-primary/10 to-purple-500/10 p-4 rounded-lg border border-domo-primary/20">
          <div className="text-sm font-medium text-domo-text-secondary mb-2 flex items-center gap-2">
            <span className="text-domo-primary">🧠</span>
            Visual & Behavioral Analysis
          </div>
          <div className="text-sm text-white whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {perception}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-domo-primary/10 p-3 rounded">
            <div className="text-xs text-domo-primary font-medium">
              Analysis Type
            </div>
            <div className="text-sm font-bold text-white">
              Visual Perception
            </div>
          </div>
          <div className="bg-domo-success/10 p-3 rounded">
            <div className="text-xs text-domo-success font-medium">Duration</div>
            <div className="text-sm font-bold text-white">60 minutes</div>
          </div>
          <div className="bg-purple-500/10 p-3 rounded">
            <div className="text-xs text-purple-400 font-medium">
              Data Source
            </div>
            <div className="text-sm font-bold text-white">Domo AI</div>
          </div>
          <div className="bg-amber-500/10 p-3 rounded">
            <div className="text-xs text-amber-400 font-medium">Status</div>
            <div className="text-sm font-bold text-white">Complete</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other formats
  return (
    <div className="text-sm text-white bg-domo-bg-elevated rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
      {JSON.stringify(perception, null, 2)}
    </div>
  );
}
