const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export interface UsageCounts {
  ideaCount?: number;
  noteCount?: number;
  resourceCount?: number;
}

/**
 * How many items use a category or tag, in words:
 * { total: 4, text: "2 ideas, 1 note and 1 resource", short: "2 ideas · 1 note · 1 resource" }.
 */
export function describeUsage(counts: UsageCounts) {
  const parts = [
    [counts.ideaCount ?? 0, 'idea'],
    [counts.noteCount ?? 0, 'note'],
    [counts.resourceCount ?? 0, 'resource'],
  ] as const;
  const used = parts.filter(([n]) => n > 0).map(([n, word]) => plural(n, word));
  const total = parts.reduce((sum, [n]) => sum + n, 0);
  const text =
    used.length > 1
      ? `${used.slice(0, -1).join(', ')} and ${used[used.length - 1]}`
      : (used[0] ?? '');
  return { total, text, short: used.length ? used.join(' · ') : 'Not used' };
}
