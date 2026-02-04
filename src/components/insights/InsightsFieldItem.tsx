'use client';

/**
 * InsightsFieldItem Component
 *
 * Displays a single qualification field in the Domo Insights panel with a visual
 * indicator showing whether the field has been captured during the conversation.
 *
 * Visual States:
 * - Uncaptured: Gray circle outline with muted label text
 * - Captured: Green checkmark with primary label text and captured value below
 *
 * @example
 * // Uncaptured field
 * <InsightsFieldItem label="Email" captured={false} />
 *
 * // Captured field with value
 * <InsightsFieldItem label="Email" captured={true} value="user@example.com" />
 */

/**
 * Props for the InsightsFieldItem component
 */
interface InsightsFieldItemProps {
  /** Display label for the field (e.g., "First Name", "Email") */
  label: string;
  /** Whether this field has been captured/filled during the conversation */
  captured: boolean;
  /** The captured value to display (only shown when captured is true) */
  value?: string | null;
}

/**
 * Renders a single field item with captured/uncaptured state indicator.
 * Used within QualificationChecklist to show individual qualification fields.
 */
export function InsightsFieldItem({ label, captured, value }: InsightsFieldItemProps) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {/* Status indicator - checkmark when captured, empty circle when not */}
      <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
        captured
          ? 'bg-green-500/20 text-green-400'
          : 'bg-domo-border text-domo-text-secondary'
      }`}>
        {captured ? (
          // Green checkmark SVG for captured state
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          // Empty circle for uncaptured state
          <span className="w-2 h-2 rounded-full border border-current" />
        )}
      </span>

      {/* Field label and optional captured value */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${captured ? 'text-domo-text-primary' : 'text-domo-text-secondary'}`}>
          {label}
        </span>
        {/* Show captured value below the label when available */}
        {captured && value && (
          <p className="text-xs text-domo-text-secondary truncate mt-0.5" title={value}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
