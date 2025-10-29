/**
 * Date Formatting Utilities
 * Functions for formatting dates and times consistently across the application
 */

/**
 * Format a date to a human-readable string
 * 
 * @param date - Date to format (Date object, string, or number)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a date and time to a human-readable string
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  return formatDate(date, options);
}

/**
 * Format a time to a human-readable string
 * 
 * @param date - Date to format (only time portion will be used)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  return formatDate(date, options);
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 days")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
      return 'just now';
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * 
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return '0s';
  }

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a date to ISO string for API usage
 * 
 * @param date - Date to format
 * @returns ISO date string or null if invalid
 */
export function formatISODate(date: Date | string | number): string | null {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj.toISOString();
  } catch {
    return null;
  }
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * 
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export function formatInputDate(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
}