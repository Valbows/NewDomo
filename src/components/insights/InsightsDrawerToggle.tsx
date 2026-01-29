'use client';

/**
 * InsightsDrawerToggle Component
 *
 * A floating button that appears on mobile devices to open the Domo Insights
 * drawer panel. Positioned on the right edge of the screen, vertically centered.
 *
 * Only visible on mobile viewports (<1024px / lg breakpoint).
 * On desktop, the insights panel is always visible as a sidebar.
 *
 * Features:
 * - Clipboard/checklist icon indicating insights functionality
 * - Optional pulsing update indicator (for future real-time notification feature)
 * - Hover state with color transition
 *
 * @see DomoInsightsPanel for the parent component that renders this toggle
 */

interface InsightsDrawerToggleProps {
  /** Callback when the toggle button is clicked */
  onClick: () => void;
  /** Whether to show the pulsing update indicator (optional, defaults to false) */
  hasUpdates?: boolean;
}

/**
 * Renders a fixed-position button on the right edge of the screen.
 * Hidden on desktop (lg+) since the sidebar is always visible.
 */
export function InsightsDrawerToggle({ onClick, hasUpdates = false }: InsightsDrawerToggleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 right-0 -translate-y-1/2 z-40 lg:hidden bg-domo-bg-card border border-r-0 border-domo-border rounded-l-lg p-2 shadow-lg hover:bg-domo-bg-elevated transition-colors group"
      aria-label="Open Domo Insights panel"
    >
      {/* Icon container with optional update indicator */}
      <div className="relative">
        {/* Clipboard/checklist icon - represents insights/data capture */}
        <svg
          className="w-5 h-5 text-domo-text-secondary group-hover:text-domo-primary transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>

        {/* Pulsing indicator dot - shown when hasUpdates is true */}
        {/* Can be used to indicate new data has been captured */}
        {hasUpdates && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-domo-primary rounded-full animate-pulse" />
        )}
      </div>
    </button>
  );
}
