export function formatDate(iso?: string): string {
  try {
    if (!iso) return "—";
    const date = new Date(iso);
    // Check if the date is valid
    if (isNaN(date.getTime())) return "—";
    // Format as "Mar 13, 2025 8:23 PM"
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  } catch {
    return "—";
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
