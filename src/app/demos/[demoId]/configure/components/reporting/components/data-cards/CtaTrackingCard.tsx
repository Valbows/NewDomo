import { CtaTrackingData } from "../../types";
import { formatDate } from "../../utils/formatters";

interface CtaTrackingCardProps {
  ctaTracking: CtaTrackingData | null;
}

export function CtaTrackingCard({ ctaTracking }: CtaTrackingCardProps) {
  if (!ctaTracking) {
    return (
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          🎯 Execute CTA?
        </h5>
        <p className="text-sm text-gray-500">
          No CTA activity recorded for this conversation
        </p>
      </div>
    );
  }

  const ctaShown = !!ctaTracking.cta_shown_at;
  const ctaClicked = !!ctaTracking.cta_clicked_at;

  return (
    <div
      className={`mb-6 p-4 border rounded-lg ${
        ctaClicked
          ? "bg-green-50 border-green-200"
          : ctaShown
          ? "bg-yellow-50 border-yellow-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <h5
        className={`font-medium mb-3 flex items-center gap-2 ${
          ctaClicked
            ? "text-green-900"
            : ctaShown
            ? "text-yellow-900"
            : "text-gray-700"
        }`}
      >
        🎯 Execute CTA?
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            ctaClicked
              ? "bg-green-100 text-green-700"
              : ctaShown
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
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
                ctaClicked ? "text-green-700" : ctaShown ? "text-yellow-700" : "text-gray-700"
              }`}
            >
              CTA Shown:
            </span>
            <p
              className={`text-sm font-medium ${
                ctaClicked ? "text-green-900" : ctaShown ? "text-yellow-900" : "text-gray-900"
              }`}
            >
              {ctaShown ? "Yes" : "No"}
            </p>
            {ctaShown && (
              <p
                className={`text-xs ${
                  ctaClicked ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {formatDate(ctaTracking.cta_shown_at || undefined)}
              </p>
            )}
          </div>

          <div>
            <span
              className={`text-xs font-medium ${
                ctaClicked ? "text-green-700" : ctaShown ? "text-yellow-700" : "text-gray-700"
              }`}
            >
              CTA Clicked:
            </span>
            <p
              className={`text-sm font-medium ${
                ctaClicked ? "text-green-900" : ctaShown ? "text-yellow-900" : "text-gray-900"
              }`}
            >
              {ctaClicked ? "Yes" : "No"}
            </p>
            {ctaClicked && (
              <p className="text-xs text-green-600">
                {formatDate(ctaTracking.cta_clicked_at || undefined)}
              </p>
            )}
          </div>
        </div>

        {ctaTracking.cta_url && (
          <div>
            <span
              className={`text-xs font-medium ${
                ctaClicked ? "text-green-700" : ctaShown ? "text-yellow-700" : "text-gray-700"
              }`}
            >
              CTA URL:
            </span>
            <p
              className={`text-sm break-all ${
                ctaClicked ? "text-green-900" : ctaShown ? "text-yellow-900" : "text-gray-900"
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
