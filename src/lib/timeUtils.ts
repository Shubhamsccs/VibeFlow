/**
 * Calculates the logical date string ('YYYY-MM-DD') based on user's customizable day rollover cutoff.
 * Default rollover is 04:00 (4:00 AM).
 * 
 * Late night sessions (e.g. at 2:00 AM) are shifted back by the cutoff offset
 * so they are assigned to the previous calendar day's logical study bucket.
 */
export function getLogicalDate(timestampMs: number, rolloverTime: string = "04:00"): string {
  const [cutoffHours, cutoffMinutes] = rolloverTime.split(":").map(Number);
  const cutoffOffsetMs = (cutoffHours * 60 + (cutoffMinutes || 0)) * 60 * 1000;
  
  // Shift timestamp back by cutoff offset so day boundary aligns with 00:00 internally
  const adjustedDate = new Date(timestampMs - cutoffOffsetMs);
  
  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
  const day = String(adjustedDate.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current logical date using the specified rollover cutoff.
 */
export function getCurrentLogicalDate(rolloverTime: string = "04:00"): string {
  return getLogicalDate(Date.now(), rolloverTime);
}

/**
 * Formats a duration in seconds into HH:MM:SS or MM:SS.
 */
export function formatSeconds(totalSeconds: number, includeHours: boolean = true): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (includeHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats a duration in seconds into human-readable e.g. "1h 24m" or "45s".
 */
export function formatDurationHuman(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
