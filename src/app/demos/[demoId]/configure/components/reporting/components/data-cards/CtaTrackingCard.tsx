import { CtaTrackingData } from "../../types";
import { formatDate } from "../../utils/formatters";

interface CtaTrackingCardProps {
  ctaTracking: CtaTrackingData | null;
}

export function CtaTrackingCard({ ctaTracking }: CtaTrackingCardProps) {
  const ctaShown = !!ctaTracking?.cta_shown_at;
  const ctaClicked = !!ctaTracking?.cta_clicked_at;
  const hasMeaningfulData = ctaShown || ctaClicked;

  // Don't show the card at all if no meaningful data
  if (!hasMeaningfulData) {
    return null;
  }

  return (
    <div
      className={`mb-6 p-4 border rounded-xl ${
        ctaClicked
          ? "bg-domo-success/10 border-domo-success/20"
          : ctaShown
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-domo-bg-elevated border-domo-border"
      }`}
    >
      <h5
        className={`font-medium mb-3 flex items-center gap-2 ${
          ctaClicked
            ? "text-domo-success"
            : ctaShown
            ? "text-amber-400"
            : "text-domo-text-secondary"
        }`}
      >
        🎯 Execute CTA?
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            ctaClicked
              ? "bg-domo-success/20 text-domo-success"
              : ctaShown
              ? "bg-amber-500/20 text-amber-400"
              : "bg-domo-bg-dark text-domo-text-muted"
          }`}
        >
          {ctaClicked ? "Yes - Clicked" : ctaShown ? "Shown - Not Clicked" : "No Activity"}
        </span>
      </h5>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span
              className={`text-xs font-medium ${
                ctaClicked ? "text-domo-success" : ctaShown ? "text-amber-400" : "text-domo-text-muted"
              }`}
            >
              CTA Shown:
            </span>
            <p
              className={`text-sm font-medium ${
                ctaClicked ? "text-white" : ctaShown ? "text-white" : "text-domo-text-secondary"
              }`}
            >
              {ctaShown ? "Yes" : "No"}
            </p>
            {ctaShown && (
              <p
                className={`text-xs ${
                  ctaClicked ? "text-domo-success/80" : "text-amber-400/80"
                }`}
              >
                {formatDate(ctaTracking.cta_shown_at || undefined)}
              </p>
            )}
          </div>

          <div>
            <span
              className={`text-xs font-medium ${
                ctaClicked ? "text-domo-success" : ctaShown ? "text-amber-400" : "text-domo-text-muted"
              }`}
            >
              CTA Clicked:
            </span>
            <p
              className={`text-sm font-medium ${
                ctaClicked ? "text-white" : ctaShown ? "text-white" : "text-domo-text-secondary"
              }`}
            >
              {ctaClicked ? "Yes" : "No"}
            </p>
            {ctaClicked && (
              <p className="text-xs text-domo-success/80">
                {formatDate(ctaTracking.cta_clicked_at || undefined)}
              </p>
            )}
          </div>
        </div>

        {ctaTracking.cta_url && (
          <div>
            <span
              className={`text-xs font-medium ${
                ctaClicked ? "text-domo-success" : ctaShown ? "text-amber-400" : "text-domo-text-muted"
              }`}
            >
              CTA URL:
            </span>
            <p
              className={`text-sm break-all ${
                ctaClicked ? "text-white" : ctaShown ? "text-white" : "text-domo-text-secondary"
              }`}
            >
              {ctaTracking.cta_url}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
