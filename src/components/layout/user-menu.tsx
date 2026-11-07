'use client';

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser, useLogout } from '@/features/auth/use-auth';

/** "Lucie Fifi" → "LF", "lucie" → "L" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Who is logged in, with Settings and Log out. Loading the profile here also
 * checks the session as soon as any app page opens: if it's no longer valid,
 * the API client logs out and sends the user to /login.
 */
export function UserMenu() {
  const { data: user, isPending } = useCurrentUser();
  const logout = useLogout();

  if (isPending) {
    // Fixed sizes on purpose: shadcn's SidebarMenuSkeleton uses Math.random(),
    // which Next.js forbids while prerendering pages.
    return (
      <div className="flex h-12 items-center gap-2 px-2" aria-hidden="true">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={`Account menu for ${user.displayName}`}
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-lavender-soft font-medium text-lavender-deep">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
            <ChevronsUpDownIcon className="ml-auto" aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <SettingsIcon aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOutIcon aria-hidden="true" />
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
