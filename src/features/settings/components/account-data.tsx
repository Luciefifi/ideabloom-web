'use client';

import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DownloadIcon, Trash2Icon } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/features/auth/api';
import { hardNavigate } from '@/lib/navigation';

/** Saves a JSON object as a file in the browser's downloads. */
function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DownloadData() {
  const exportData = useMutation({
    mutationFn: authApi.exportData,
    onSuccess: (data) => {
      downloadJson(
        data,
        `ideabloom-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
      );
      toast.success('Your data was downloaded');
    },
    onError: (e) => toast.error(`Couldn't download. ${errorMessage(e)}`),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        One file with everything you&apos;ve created: ideas, projects,
        milestones, tasks, notes, resources, categories, tags and your history.
        Your password is never included.
      </p>
      <Button
        variant="outline"
        disabled={exportData.isPending}
        onClick={() => exportData.mutate()}
      >
        {exportData.isPending ? (
          <Spinner aria-hidden="true" />
        ) : (
          <DownloadIcon aria-hidden="true" />
        )}
        Download my data
      </Button>
    </div>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const passwordId = useId();
  const confirmId = useId();
  const remove = useMutation({
    mutationFn: () => authApi.deleteAccount(password),
    // A full page load: nothing of the deleted account stays in memory.
    onSuccess: () => hardNavigate('/login?deleted=1'),
  });
  const ready = password.length > 0 && confirm === 'DELETE';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Permanently deletes your account and everything in it. This can&apos;t
        be undone. Download your data first if you want a copy.
      </p>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setPassword('');
            setConfirm('');
            remove.reset();
          }
        }}
      >
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          <Trash2Icon aria-hidden="true" />
          Delete my account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready && !remove.isPending) remove.mutate();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                All your ideas, projects, tasks, notes and resources will be
                deleted permanently, and you&apos;ll be signed out everywhere.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <FormErrorAlert error={remove.error} />
            <div className="space-y-1.5">
              <label htmlFor={passwordId} className="text-sm font-medium">
                Your password
              </label>
              <Input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={confirmId} className="text-sm font-medium">
                Type <strong>DELETE</strong> to confirm
              </label>
              <Input
                id={confirmId}
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={!ready || remove.isPending}
              >
                {remove.isPending && <Spinner aria-hidden="true" />}
                Delete permanently
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
