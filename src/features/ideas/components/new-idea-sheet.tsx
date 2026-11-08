'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCreateIdea } from '../use-ideas';
import { IdeaForm } from './idea-form';

/** "New idea" with every field, in a side panel (quick capture is for titles only). */
export function NewIdeaSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const create = useCreateIdea();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) create.reset();
      }}
    >
      <SheetTrigger render={<Button />}>
        <PlusIcon aria-hidden="true" />
        New idea
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New idea</SheetTitle>
          <SheetDescription>
            Only the title is required. You can add the rest later.
          </SheetDescription>
        </SheetHeader>
        {/* key: a fresh, empty form every time the panel opens */}
        <div className="px-4 pb-6">
          {open && (
            <IdeaForm
              key="new"
              submitLabel="Create idea"
              pendingLabel="Creating…"
              pending={create.isPending}
              error={create.error}
              onCancel={() => setOpen(false)}
              onSubmit={(input) =>
                create.mutate(input, {
                  onSuccess: (idea) => {
                    setOpen(false);
                    toast.success(`Created "${idea.title}"`, {
                      action: {
                        label: 'Open',
                        onClick: () => router.push(`/ideas/${idea.id}`),
                      },
                    });
                  },
                })
              }
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
