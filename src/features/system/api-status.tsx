'use client';

import { cn } from '@/lib/utils';
import { useApiHealth, type ApiHealthState } from './use-api-health';

const states: Record<ApiHealthState, { label: string; dot: string }> = {
  checking: {
    label: 'Checking API…',
    dot: 'bg-muted-foreground/50 animate-pulse',
  },
  online: { label: 'API connected', dot: 'bg-success' },
  'database-down': { label: 'Database unavailable', dot: 'bg-warning' },
  offline: { label: 'API unreachable', dot: 'bg-destructive' },
};

/** Small connection indicator in the sidebar footer. */
export function ApiStatus() {
  const state = states[useApiHealth()];

  return (
    <div
      role="status"
      aria-live="polite"
      title={state.label}
      className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center"
    >
      <span className={cn('size-2 shrink-0 rounded-full', state.dot)} />
      <span className="group-data-[collapsible=icon]:sr-only">
        {state.label}
      </span>
    </div>
  );
}
