'use client';

import { LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useLogoutAll } from '@/features/auth/use-auth';

/** "Log out of all devices": useful if you used a shared computer or lost a phone. */
export function SessionsCard() {
  const [open, setOpen] = useState(false);
  const logoutAll = useLogoutAll();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Logged in somewhere you no longer use, like a shared computer or a lost
        phone? This ends every session, including this one.
      </p>
      <FormErrorAlert error={logoutAll.error} />

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={<Button variant="outline" className="text-destructive" />}
        >
          <LogOutIcon aria-hidden="true" />
          Log out of all devices
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to log in again on every device, including this
              one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutAll.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={logoutAll.isPending}
              onClick={() =>
                logoutAll.mutate(undefined, {
                  onError: () => setOpen(false),
                })
              }
            >
              {logoutAll.isPending && <Spinner aria-hidden="true" />}
              Log out everywhere
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
