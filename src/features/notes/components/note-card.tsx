import { FolderIcon, LightbulbIcon, PinIcon } from 'lucide-react';
import Link from 'next/link';
import { CategoryChip, TagChip } from '@/features/ideas/components/idea-badges';
import { editedAgo } from '../note-styles';
import type { NoteSummary } from '../types';

export function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <article
      aria-labelledby={`note-${note.id}-title`}
      className="relative flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs transition-colors focus-within:border-lavender hover:border-lavender"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 id={`note-${note.id}-title`} className="font-medium break-words">
          {/* The whole card is clickable through this link's ::after. */}
          <Link
            href={`/notes/${note.id}`}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {note.title}
          </Link>
        </h3>
        {note.isPinned && (
          <PinIcon
            className="size-4 shrink-0 text-lavender-deep"
            aria-label="Pinned"
          />
        )}
      </div>
      {note.excerpt ? (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {note.excerpt}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Empty note</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        {note.category && <CategoryChip category={note.category} />}
        {note.tags.map((tag) => (
          <TagChip key={tag.id} name={tag.name} />
        ))}
        {note.project && (
          <span className="inline-flex items-center gap-1">
            <FolderIcon className="size-3" aria-hidden="true" />
            <span className="sr-only">Project:</span>
            {note.project.title}
          </span>
        )}
        {note.idea && (
          <span className="inline-flex items-center gap-1">
            <LightbulbIcon className="size-3" aria-hidden="true" />
            <span className="sr-only">Idea:</span>
            {note.idea.title}
          </span>
        )}
        <span className="ml-auto">{editedAgo(note.updatedAt)}</span>
      </div>
    </article>
  );
}
