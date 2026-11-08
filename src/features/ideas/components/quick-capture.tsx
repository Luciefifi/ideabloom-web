'use client';

import { PlusIcon, SparklesIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useCreateIdea } from '../use-ideas';

const TITLE_MAX = 200;

/**
 * The fastest way to save an idea: type, press Enter, keep going.
 * The idea lands in the Inbox; details can be added later.
 */
export function QuickCapture() {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateIdea();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || create.isPending) return;

    create.mutate(
      { title: trimmed },
      {
        onSuccess: (idea) => {
          setTitle('');
          toast.success(`Saved "${idea.title}" to your inbox`);
          inputRef.current?.focus(); // ready for the next idea
        },
        onError: (error) =>
          toast.error(`Couldn't save the idea. ${errorMessage(error)}`),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-xs focus-within:border-lavender focus-within:ring-3 focus-within:ring-lavender/25"
    >
      <SparklesIcon
        className="ml-2 size-4 shrink-0 text-lavender"
        aria-hidden="true"
      />
      <label htmlFor="quick-capture" className="sr-only">
        Capture a new idea
      </label>
      <Input
        ref={inputRef}
        id="quick-capture"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={TITLE_MAX}
        placeholder="Capture an idea… (press Enter to save)"
        autoComplete="off"
        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button type="submit" disabled={!title.trim() || create.isPending}>
        {create.isPending ? (
          <Spinner aria-hidden="true" />
        ) : (
          <PlusIcon aria-hidden="true" />
        )}
        {/* One label: visually hidden on phones (icon only), always read by screen readers */}
        <span className="sr-only sm:not-sr-only">Add idea</span>
      </Button>
    </form>
  );
}
