'use client';

/**
 * QualificationChecklist Component
 *
 * Displays a checklist of qualification fields that the AI agent collects
 * during a demo conversation. Shows real-time progress as fields are captured.
 *
 * Fields tracked:
 * - First Name
 * - Last Name
 * - Email
 * - Position/Role
 *
 * Data Source: qualification_data table (via useInsightsData hook)
 * Real-time Updates: Receives field_captured broadcasts from objectiveHandlers.ts
 *
 * @example
 * <QualificationChecklist
 *   fields={{
 *     firstName: { captured: true, value: 'John' },
 *     lastName: { captured: true, value: 'Doe' },
 *     email: { captured: false, value: null },
 *     position: { captured: false, value: null },
 *   }}
 * />
 */

import { InsightsFieldItem } from './InsightsFieldItem';

/**
 * Represents the state of a single qualification field.
 * Used to track whether a field has been captured and its value.
 */
export interface QualificationField {
  /** Whether this field has been captured during the conversation */
  captured: boolean;
  /** The captured value, or null if not yet captured */
  value: string | null;
}

/**
 * Collection of all qualification fields tracked during a demo.
 * Maps to columns in the qualification_data Supabase table.
 */
export interface QualificationFields {
  firstName: QualificationField;
  lastName: QualificationField;
  email: QualificationField;
  position: QualificationField;
}

interface QualificationChecklistProps {
  /** The current state of all qualification fields */
  fields: QualificationFields;
}

/**
 * Renders the qualification checklist with progress indicator.
 * Shows a header with completion count (e.g., "2/4") and individual field items.
 */
export function QualificationChecklist({ fields }: QualificationChecklistProps) {
  // Calculate how many fields have been captured for the progress indicator
  const capturedCount = Object.values(fields).filter(f => f.captured).length;
  const totalFields = Object.keys(fields).length;

  return (
    <div className="space-y-2">
      {/* Section header with completion progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-domo-text-primary">
          Qualification
        </h3>
        <span className="text-xs text-domo-text-secondary">
          {capturedCount}/{totalFields}
        </span>
      </div>

      {/* Field list container */}
      <div className="bg-domo-bg-dark/50 rounded-lg p-3 space-y-0.5">
        <InsightsFieldItem
          label="First Name"
          captured={fields.firstName.captured}
          value={fields.firstName.value}
        />
        <InsightsFieldItem
          label="Last Name"
          captured={fields.lastName.captured}
          value={fields.lastName.value}
        />
        <InsightsFieldItem
          label="Email"
          captured={fields.email.captured}
          value={fields.email.value}
        />
        <InsightsFieldItem
          label="Position"
          captured={fields.position.captured}
          value={fields.position.value}
        />
      </div>
    </div>
  );
}
