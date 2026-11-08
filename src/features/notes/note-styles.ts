import { formatDistance } from 'date-fns';

/** The API gives new notes this title when none is sent. */
export const DEFAULT_NOTE_TITLE = 'Untitled note';

/** "edited 5 minutes ago" / "edited just now" */
export function editedAgo(updatedAt: string, now: Date = new Date()): string {
  const distance = formatDistance(new Date(updatedAt), now, {
    addSuffix: true,
  });
  return `edited ${distance === 'less than a minute ago' ? 'just now' : distance}`;
}
