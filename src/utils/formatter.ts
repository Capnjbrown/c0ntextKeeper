/**
 * Formatting utilities for c0ntextKeeper
 * Handles timestamp formatting according to user preferences
 */

/**
 * Format timestamp to user's preferred format (Mountain Time)
 * Format: "Month DD, YYYY H:MM AM/PM MT"
 * Example: "August 28, 2025 4:39 PM MT"
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  // Format to Mountain Time (America/Denver)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Denver",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(date);

  // Build the formatted string
  const month = parts.find((p) => p.type === "month")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || "";
  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "";

  return `${month} ${day}, ${year} ${hour}:${minute} ${dayPeriod} MT`;
}

/**
 * Format date only (Mountain Time)
 * Format: "Month DD, YYYY"
 * Example: "August 28, 2025"
 */
export function formatDate(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Denver",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Format time only (Mountain Time)
 * Format: "H:MM AM/PM MT"
 * Example: "4:39 PM MT"
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Denver",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const timeString = new Intl.DateTimeFormat("en-US", options).format(date);
  return `${timeString} MT`;
}

/**
 * Get relative time description
 * Example: "2 hours ago", "3 days ago", "just now"
 */
export function getRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Format file size in human-readable format
 * Example: "1.5 MB", "750 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format file count with proper pluralization
 */
export function formatFileCount(count: number): string {
  return count === 1 ? "1 file" : `${count} files`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000)
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Format tool statistics for display
 */
export function formatToolStats(toolCounts: Record<string, number>): string {
  const entries = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (entries.length === 0) return "No tools used";

  return entries.map(([tool, count]) => `${tool} (${count}x)`).join(", ");
}

/**
 * Get top N tools by usage count
 */
export function getTopTools(
  toolCounts: Record<string, number>,
  limit = 5,
): string[] {
  return Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tool]) => tool);
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round((sum / numbers.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Format relevance score as percentage
 */
export function formatRelevance(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Get package version from package.json
 */
export function getPackageVersion(): string {
  try {
    const pkg = require("../../package.json");
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}
