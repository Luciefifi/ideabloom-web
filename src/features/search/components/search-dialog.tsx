'use client';

import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Highlighted } from '../highlight';
import {
  resultHref,
  SEARCH_TYPE_ICONS,
  SEARCH_TYPE_LABELS,
} from '../search-styles';
import { useSearch } from '../use-search';

/** Ctrl+K (Cmd+K on a Mac) opens search from anywhere. */
function useShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
}

/**
 * The search button in the top bar and the quick-search dialog it opens.
 * Arrow keys move through results, Enter opens one, Escape closes.
 */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 200);
  const search = useSearch(query);
  useShortcut(() => setOpen(true));

  const go = (href: string) => {
    setOpen(false);
    setText('');
    router.push(href);
  };
  const groups = (search.data?.groups ?? []).filter((g) => g.items.length);
  const seeAll = `/search?q=${encodeURIComponent(text.trim())}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs hover:border-lavender hover:text-foreground sm:w-64"
      >
        <SearchIcon className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only sm:flex-1 sm:text-left">
          Search…
        </span>
        <kbd
          className="hidden rounded border bg-muted px-1.5 font-sans text-[11px] sm:inline"
          aria-hidden="true"
        >
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search IdeaBloom</DialogTitle>
          <DialogDescription className="sr-only">
            Search ideas, projects, tasks, notes and resources. Use the arrow
            keys and Enter to open a result.
          </DialogDescription>
          {/* Results come from the API already ranked, so cmdk must not filter them again. */}
          <Command shouldFilter={false} label="Search everything">
            <CommandInput
              value={text}
              onValueChange={setText}
              placeholder="Search ideas, projects, tasks, notes…"
            />
            <CommandList className="max-h-[60vh]">
              {query && search.isFetching && groups.length === 0 && (
                <div className="flex justify-center py-6" aria-live="polite">
                  <Spinner aria-label="Searching" />
                </div>
              )}
              {query && !search.isFetching && groups.length === 0 && (
                <CommandEmpty>
                  {search.isError
                    ? "Search isn't available right now."
                    : `Nothing found for "${query}".`}
                </CommandEmpty>
              )}
              {!query && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Type to search everything. Partial words work: “gard” finds
                  “garden”.
                </p>
              )}
              {groups.map((group) => {
                const Icon = SEARCH_TYPE_ICONS[group.type];
                return (
                  <CommandGroup
                    key={group.type}
                    heading={`${SEARCH_TYPE_LABELS[group.type]} (${group.total})`}
                  >
                    {group.items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.type}-${item.id}`}
                        onSelect={() => go(resultHref(item))}
                        className="items-start"
                      >
                        <Icon
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            <Highlighted text={item.title} />
                          </span>
                          {item.snippet && (
                            <span className="block truncate text-xs text-muted-foreground">
                              <Highlighted text={item.snippet} />
                            </span>
                          )}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              {query && groups.length > 0 && (
                <CommandGroup>
                  <CommandItem value="see-all" onSelect={() => go(seeAll)}>
                    <SearchIcon className="size-4" aria-hidden="true" />
                    See all results for “{text.trim()}”
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
