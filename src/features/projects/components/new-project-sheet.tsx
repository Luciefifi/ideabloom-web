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
import { useCreateProject } from '../use-projects';
import { ProjectForm } from './project-form';

export function NewProjectSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const create = useCreateProject();

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
        New project
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New project</SheetTitle>
          <SheetDescription>
            Only the title is required. Tip: you can also turn an existing idea
            into a project from the idea&apos;s page.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {open && (
            <ProjectForm
              submitLabel="Create project"
              pendingLabel="Creating…"
              pending={create.isPending}
              error={create.error}
              onCancel={() => setOpen(false)}
              onSubmit={(input) =>
                create.mutate(input, {
                  onSuccess: (project) => {
                    setOpen(false);
                    toast.success(`Created "${project.title}"`);
                    router.push(`/projects/${project.id}`);
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
