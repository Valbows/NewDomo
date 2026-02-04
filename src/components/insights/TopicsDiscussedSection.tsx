'use client';

/**
 * TopicsDiscussedSection Component
 *
 * Displays the key topics and pain points identified during the demo conversation.
 * This information is captured by the product_interest_discovery objective.
 *
 * Displays:
 * - Primary Interest: The main topic the visitor is interested in (blue tag)
 * - Pain Points: Challenges or problems mentioned by the visitor (amber tags)
 *
 * Data Source: product_interest_data table (via useInsightsData hook)
 * Real-time Updates: Receives topics_captured broadcasts from objectiveHandlers.ts
 *
 * @example
 * <TopicsDiscussedSection
 *   primaryInterest="Analytics Dashboard"
 *   painPoints={['Manual reporting', 'Data silos']}
 * />
 */

interface TopicsDiscussedSectionProps {
  /** The visitor's main area of interest, captured during conversation */
  primaryInterest: string | null;
  /** Array of pain points/challenges mentioned by the visitor */
  painPoints: string[];
}

/**
 * Renders the key topics section with styled tags for interests and pain points.
 * Shows an empty state when no topics have been discussed yet.
 */
export function TopicsDiscussedSection({ primaryInterest, painPoints }: TopicsDiscussedSectionProps) {
  // Check if we have any topics to display
  const hasTopics = primaryInterest || painPoints.length > 0;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-domo-text-primary">
        Key Topics
      </h3>

      <div className="bg-domo-bg-dark/50 rounded-lg p-3 space-y-3">
        {!hasTopics ? (
          // Empty state - no topics captured yet
          <p className="text-sm text-domo-text-secondary italic">
            No topics discussed yet
          </p>
        ) : (
          <>
            {/* Primary Interest - displayed as a blue tag */}
            {primaryInterest && (
              <div className="space-y-1">
                <p className="text-xs text-domo-text-secondary uppercase tracking-wide">
                  Primary Interest
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-domo-primary/20 text-domo-primary text-sm">
                    {primaryInterest}
                  </span>
                </div>
              </div>
            )}

            {/* Pain Points - displayed as amber/warning colored tags */}
            {painPoints.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-domo-text-secondary uppercase tracking-wide">
                  Pain Points
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {painPoints.map((point, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
