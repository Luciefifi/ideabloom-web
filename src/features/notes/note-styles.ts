import { formatDistance } from 'date-fns';

/** The API gives new notes this title when none is sent. */
export const DEFAULT_NOTE_TITLE = 'Untitled note';

/** "5 minutes ago" / "just now" */
export function timeAgo(timestamp: string, now: Date = new Date()): string {
  const distance = formatDistance(new Date(timestamp), now, {
    addSuffix: true,
  });
  return distance === 'less than a minute ago' ? 'just now' : distance;
}

/** "edited 5 minutes ago" / "edited just now" */
export function editedAgo(updatedAt: string, now: Date = new Date()): string {
  return `edited ${timeAgo(updatedAt, now)}`;
}
