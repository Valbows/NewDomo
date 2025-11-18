export function formatDate(iso?: string): string {
  try {
    if (!iso) return "—";
    const date = new Date(iso);
    // Check if the date is valid
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString();
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
