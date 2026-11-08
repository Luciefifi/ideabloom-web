import { cn } from '@/lib/utils';
import {
  categoryStyle,
  PRIORITY_DOTS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../idea-styles';
import type { Category, IdeaPriority, IdeaStatus } from '../types';

const chip =
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <span className={cn(chip, STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: IdeaPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn('size-2 rounded-full', PRIORITY_DOTS[priority])}
        aria-hidden="true"
      />
      {PRIORITY_LABELS[priority]} <span className="sr-only">priority</span>
    </span>
  );
}

export function CategoryChip({
  category,
}: {
  category: Pick<Category, 'name' | 'color'>;
}) {
  const style = categoryStyle(category.color);
  return (
    <span className={cn(chip, style.chip)}>
      <span
        className={cn('size-1.5 rounded-full', style.dot)}
        aria-hidden="true"
      />
      {category.name}
    </span>
  );
}

export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
      #{name}
    </span>
  );
}
