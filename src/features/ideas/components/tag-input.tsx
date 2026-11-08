'use client';

import { XIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export const TAG_MAX_LENGTH = 30;
export const MAX_TAGS = 20;
/** Same rule as the API: letters (any language), numbers, spaces and - _ . # + */
const TAG_PATTERN = /^[\p{L}\p{N} _.#+-]+$/u;

/** Trims and collapses spaces: "  web   design " → "web design". */
export function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Returns an error message, or null if the tag can be added. */
export function validateTag(tag: string, existing: string[]): string | null {
  if (!tag) return null;
  if (tag.length > TAG_MAX_LENGTH)
    return `Tags can be at most ${TAG_MAX_LENGTH} characters`;
  if (!TAG_PATTERN.test(tag))
    return 'Tags can use letters, numbers, spaces and - _ . # +';
  if (existing.some((t) => t.toLowerCase() === tag.toLowerCase()))
    return `"${tag}" is already added`;
  if (existing.length >= MAX_TAGS) return `At most ${MAX_TAGS} tags`;
  return null;
}

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tag names, offered as suggestions while typing. */
  suggestions?: string[];
  'aria-describedby'?: string;
}

/**
 * Type a tag and press Enter or comma to add it. Backspace in an empty box
 * removes the last tag. New tags are created when the idea is saved.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  ...aria
}: TagInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const errorId = `${id}-tag-error`;

  const add = (raw: string) => {
    const tag = normalizeTag(raw);
    const problem = validateTag(tag, value);
    if (problem) {
      setError(problem);
      return;
    }
    if (tag) onChange([...value, tag]);
    setText('');
    setError(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // don't submit the form / type the comma
      add(text);
    } else if (event.key === 'Backspace' && text === '' && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const available = suggestions.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          error && 'border-destructive',
        )}
      >
        <ul className="contents" aria-label="Added tags">
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-lavender-soft py-0.5 pr-1 pl-2 text-xs font-medium text-lavender-deep"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="rounded p-0.5 hover:bg-lavender/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => text.trim() && add(text)}
          list={listId}
          placeholder={
            value.length ? 'Add another…' : 'Type a tag, press Enter'
          }
          aria-invalid={!!error}
          aria-describedby={
            [aria['aria-describedby'], error ? errorId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <datalist id={listId}>
          {available.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
