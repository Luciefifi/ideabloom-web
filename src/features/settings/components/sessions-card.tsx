'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LaptopIcon, LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { authApi, type Session } from '@/features/auth/api';
import { useLogout, useLogoutAll } from '@/features/auth/use-auth';
import { timeAgo } from '@/features/notes/note-styles';

const sessionsKey = ['auth', 'sessions'] as const;

function DeviceRow({ session }: { session: Session }) {
  const queryClient = useQueryClient();
  const logout = useLogout();
  const signOut = useMutation({
    mutationFn: () => authApi.signOutSession(session.id),
    onSuccess: () => {
      toast.success(`Signed out ${session.device}`);
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
    onError: (e) => toast.error(`Couldn't sign out. ${errorMessage(e)}`),
  });
  const pending = signOut.isPending || logout.isPending;

  return (
    <li className="flex items-center gap-3 py-3">
      <LaptopIcon
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {session.device}
          {session.current && (
            <span className="ml-2 rounded-full bg-lavender-soft px-2 py-0.5 text-xs text-lavender-deep">
              This device
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Active {timeAgo(session.lastActiveAt)} · signed in{' '}
          {format(new Date(session.signedInAt), 'd MMM yyyy')}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label={`Sign out ${session.device}${session.current ? ' (this device)' : ''}`}
        // This device: a normal logout (clears everything and goes to the login page).
        onClick={() => (session.current ? logout.mutate() : signOut.mutate())}
      >
        {pending && <Spinner aria-hidden="true" />}
        Sign out
      </Button>
    </li>
  );
}

/** Where you're signed in, with "Sign out" per device and "Log out of all devices". */
export function SessionsCard() {
  const [open, setOpen] = useState(false);
  const logoutAll = useLogoutAll();
  const sessions = useQuery({
    queryKey: sessionsKey,
    queryFn: authApi.sessions,
  });

  return (
    <div className="space-y-4">
      {sessions.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : sessions.isError ? (
        <FormErrorAlert error={sessions.error} />
      ) : (
        <ul aria-label="Signed-in devices" className="divide-y">
          {sessions.data.map((session) => (
            <DeviceRow key={session.id} session={session} />
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        Don&apos;t recognise a device, or used a shared computer? Sign it out,
        or end every session at once (including this one).
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
