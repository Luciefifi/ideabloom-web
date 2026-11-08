'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArchiveIcon, LinkIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { IdeaSummary } from '../types';
import { useToggleFavorite } from '../use-ideas';
import {
  CategoryChip,
  PriorityIndicator,
  StatusBadge,
  TagChip,
} from './idea-badges';

export function IdeaCard({ idea }: { idea: IdeaSummary }) {
  const toggleFavorite = useToggleFavorite();
  const updated = new Date(idea.updatedAt);

  return (
    <article
      aria-labelledby={`idea-${idea.id}-title`}
      className={cn(
        'group relative flex gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-lavender/60',
        idea.archivedAt && 'opacity-75',
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={idea.status} />
          {idea.category && <CategoryChip category={idea.category} />}
          {idea.priority && <PriorityIndicator priority={idea.priority} />}
          {idea.archivedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ArchiveIcon className="size-3" aria-hidden="true" />
              Archived
            </span>
          )}
        </div>

        <h3 id={`idea-${idea.id}-title`} className="leading-snug font-medium">
          {/* The ::after makes the whole card clickable while keeping one real link. */}
          <Link
            href={`/ideas/${idea.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {idea.title}
          </Link>
        </h3>

        {idea.excerpt && (
          <p className="line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
            {idea.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {idea.tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} />
          ))}
          {idea.linkCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="size-3" aria-hidden="true" />
              {idea.linkCount} {idea.linkCount === 1 ? 'link' : 'links'}
            </span>
          )}
          <time
            dateTime={idea.updatedAt}
            title={updated.toLocaleString()}
            className="ml-auto"
          >
            Updated {formatDistanceToNow(updated, { addSuffix: true })}
          </time>
        </div>
      </div>

      {/* relative + z-10: clickable above the card-wide link */}
      <button
        type="button"
        onClick={() =>
          toggleFavorite.mutate({ id: idea.id, isFavorite: !idea.isFavorite })
        }
        aria-pressed={idea.isFavorite}
        aria-label={
          idea.isFavorite
            ? `Remove "${idea.title}" from favourites`
            : `Add "${idea.title}" to favourites`
        }
        className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <StarIcon
          className={cn(
            'size-4',
            idea.isFavorite && 'fill-amber-400 text-amber-500',
          )}
          aria-hidden="true"
        />
      </button>
    </article>
  );
}
