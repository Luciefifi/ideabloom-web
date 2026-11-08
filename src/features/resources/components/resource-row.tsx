import { ExternalLinkIcon, FolderIcon, LightbulbIcon } from 'lucide-react';
import { CategoryChip, TagChip } from '@/features/ideas/components/idea-badges';
import { RESOURCE_TYPE_ICONS, RESOURCE_TYPE_LABELS } from '../resource-styles';
import type { Resource } from '../types';

/** One saved link: opens safely in a new tab; the title opens the edit panel. */
export function ResourceRow({
  resource,
  onEdit,
  compact,
}: {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  /** Smaller version for idea/project pages. */
  compact?: boolean;
}) {
  const Icon = RESOURCE_TYPE_ICONS[resource.type];
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-lavender-soft text-lavender-deep"
        title={RESOURCE_TYPE_LABELS[resource.type]}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span className="sr-only">{RESOURCE_TYPE_LABELS[resource.type]}:</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <button
            type="button"
            onClick={() => onEdit(resource)}
            className="text-left text-sm font-medium break-words hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {resource.title}
          </button>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
          >
            {resource.domain || 'Open link'}
            <ExternalLinkIcon className="size-3" aria-hidden="true" />
            <span className="sr-only">
              (opens {resource.title} in a new tab)
            </span>
          </a>
        </div>
        {!compact && resource.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {resource.description}
          </p>
        )}
        {!compact && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {resource.category && <CategoryChip category={resource.category} />}
            {resource.tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} />
            ))}
            {resource.project && (
              <span className="inline-flex items-center gap-1">
                <FolderIcon className="size-3" aria-hidden="true" />
                <span className="sr-only">Project:</span>
                {resource.project.title}
              </span>
            )}
            {resource.idea && (
              <span className="inline-flex items-center gap-1">
                <LightbulbIcon className="size-3" aria-hidden="true" />
                <span className="sr-only">Idea:</span>
                {resource.idea.title}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
