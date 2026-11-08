import { Fragment } from 'react';
import { HIGHLIGHT_END, HIGHLIGHT_START } from './types';

const MARKERS = new RegExp(`[${HIGHLIGHT_START}${HIGHLIGHT_END}]`, 'g');

/** The text without highlight markers (for links, labels and comparisons). */
export function plainText(text: string): string {
  return text.replace(MARKERS, '');
}

/**
 * Shows search text with the matching words highlighted.
 *
 * The API marks matches with two special characters instead of HTML. Here the
 * text is split on them and each part becomes ordinary React text, so whatever
 * the text contains (even "<script>") is displayed, never run.
 */
export function Highlighted({ text }: { text: string }) {
  const parts: { text: string; match: boolean }[] = [];
  let match = false;
  let current = '';
  for (const char of text) {
    if (char === HIGHLIGHT_START || char === HIGHLIGHT_END) {
      if (current) parts.push({ text: current, match });
      current = '';
      match = char === HIGHLIGHT_START;
    } else {
      current += char;
    }
  }
  if (current) parts.push({ text: current, match });

  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded-sm bg-lavender-soft px-0.5 font-medium text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
