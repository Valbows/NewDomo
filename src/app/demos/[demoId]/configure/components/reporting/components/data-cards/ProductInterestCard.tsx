import { ProductInterestData } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ProductInterestCardProps {
  productInterest: ProductInterestData | null;
}

export function ProductInterestCard({ productInterest }: ProductInterestCardProps) {
  const hasMeaningfulData = !!(
    productInterest?.primary_interest ||
    (productInterest?.pain_points && productInterest.pain_points.length > 0)
  );

  // Don't show the card at all if no meaningful data
  if (!hasMeaningfulData) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
        🎯 Reason Why They Visited Website
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          Captured
        </span>
      </h5>
      <div className="space-y-4">
        <div>
          <span className="text-xs font-medium text-green-700">Primary Interest:</span>
          <p className="text-sm text-green-900 font-medium mt-1">
            {productInterest.primary_interest || "Not specified"}
          </p>
        </div>

        {productInterest.pain_points && productInterest.pain_points.length > 0 && (
          <div>
            <span className="text-xs font-medium text-green-700">Pain Points:</span>
            <ul className="mt-1 space-y-1">
              {productInterest.pain_points.map((painPoint, index) => (
                <li
                  key={index}
                  className="text-sm text-green-900 flex items-start gap-2"
                >
                  <span className="text-green-600 mt-1">•</span>
                  <span>{painPoint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <span className="text-xs font-medium text-green-700">Captured:</span>
          <p className="text-xs text-green-600">
            {formatDate(productInterest.received_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
