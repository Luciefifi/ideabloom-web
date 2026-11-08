'use client';

import { FolderInputIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useConvertIdea } from '../use-projects';

const dateInput =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

/**
 * "Convert to project": the idea's title, description, category and
 * priority are copied by the API; here you can adjust the title and set dates.
 */
export function ConvertIdeaDialog({
  idea,
}: {
  idea: { id: string; title: string };
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(idea.title);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const router = useRouter();
  const convert = useConvertIdea(idea.id);

  const dateError =
    startDate && targetDate && targetDate < startDate
      ? "The target date can't be before the start date"
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) convert.reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <FolderInputIcon aria-hidden="true" />
        Convert to project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn this idea into a project</DialogTitle>
          <DialogDescription>
            The description, category and priority come along. The idea is
            marked &ldquo;Converted to project&rdquo; and linked to it.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim() || dateError) return;
            convert.mutate(
              {
                title: title.trim(),
                startDate: startDate || null,
                targetDate: targetDate || null,
              },
              {
                onSuccess: (project) => {
                  setOpen(false);
                  toast.success(`"${project.title}" is now a project`);
                  router.push(`/projects/${project.id}`);
                },
              },
            );
          }}
          noValidate
        >
          <FieldGroup>
            <FormErrorAlert error={convert.error} />
            <Field>
              <FieldLabel htmlFor="convert-title">Project title</FieldLabel>
              <Input
                id="convert-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="h-9"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="convert-start">Start date</FieldLabel>
                <input
                  id="convert-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={dateInput}
                />
              </Field>
              <Field data-invalid={!!dateError}>
                <FieldLabel htmlFor="convert-target">Target date</FieldLabel>
                <input
                  id="convert-target"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  aria-invalid={!!dateError}
                  className={dateInput}
                />
                {dateError && <FieldError>{dateError}</FieldError>}
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !!dateError || convert.isPending}
            >
              {convert.isPending && <Spinner aria-hidden="true" />}
              {convert.isPending ? 'Converting…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
