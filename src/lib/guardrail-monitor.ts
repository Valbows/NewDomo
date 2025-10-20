/**
 * Guardrail monitoring utilities
 * Use these to detect when specific guardrails are triggered
 */

export interface GuardrailViolation {
  type: string;
  message: string;
  context: any;
  timestamp: string;
  conversationId?: string;
}

export class GuardrailMonitor {
  private static violations: GuardrailViolation[] = [];

  static logViolation(violation: Omit<GuardrailViolation, 'timestamp'>) {
    const fullViolation: GuardrailViolation = {
      ...violation,
      timestamp: new Date().toISOString()
    };
    
    this.violations.push(fullViolation);
    
    // Log to console with emoji for easy spotting
    console.warn(`🚨 GUARDRAIL VIOLATION: ${violation.type}`, {
      message: violation.message,
      context: violation.context,
      timestamp: fullViolation.timestamp
    });
    
    // In production, you might want to send to monitoring service
    // this.sendToMonitoring(fullViolation);
  }

  static getViolations(): GuardrailViolation[] {
    return [...this.violations];
  }

  static clearViolations() {
    this.violations = [];
  }

  static getViolationsByType(type: string): GuardrailViolation[] {
    return this.violations.filter(v => v.type === type);
  }
}

// Specific guardrail violation types
export const GuardrailTypes = {
  TOOL_VERBALIZATION: 'tool_verbalization',
  INVALID_VIDEO_TITLE: 'invalid_video_title',
  SENSITIVE_TOPIC: 'sensitive_topic',
  PARROTING_ATTEMPT: 'parroting_attempt',
  VIDEO_HALLUCINATION: 'video_hallucination',
  MISSING_EXACT_TITLE: 'missing_exact_title'
} as const;