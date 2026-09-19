/**
 * Formats a duration in seconds into mm:ss or hh:mm:ss format
 */
export function formatDuration(seconds: number | string | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(Number(seconds))) {
    return '0:00';
  }

  const sec = Math.max(0, Math.floor(Number(seconds)));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

/**
 * Parses various duration representations into total seconds
 * Supports "03:45", "1:20:15", "PT3M45S", or raw numeric string
 */
export function parseDurationToSeconds(duration: string | number | undefined | null): number {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;

  const str = String(duration).trim();

  // If already numeric
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  // Handle ISO 8601 (PT3M45S)
  const isoMatch = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10);
    const minutes = parseInt(isoMatch[2] || '0', 10);
    const seconds = parseInt(isoMatch[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Handle standard "03:45" or "1:15:20"
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return 0;
}
