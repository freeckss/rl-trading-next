/**
 * Date and timezone utilities for vehicle listings and boost schedules.
 * Converts between ISO UTC strings and local Philippine Time (UTC+8) for HTML datetime-local inputs.
 */

/**
 * Converts an ISO string (UTC or with timezone) into a local `YYYY-MM-DDTHH:mm` string
 * suitable for `<input type="datetime-local" />`.
 *
 * Prevents UTC timezone shifting when opening modal dialogs in Philippine Time (UTC+8).
 */
export function isoToDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a `YYYY-MM-DDTHH:mm` string from `<input type="datetime-local" />`
 * into a clean ISO 8601 UTC string for storage in PostgreSQL TIMESTAMPTZ columns.
 */
export function dateTimeLocalToIso(localString: string | null | undefined): string | null {
  if (!localString || !localString.trim()) return null;
  const d = new Date(localString);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

