'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { allNavItems, isNavItemActive } from './nav-items';

export function TopBar() {
  const pathname = usePathname();
  const current = allNavItems.find((item) => isNavItemActive(item, pathname));

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {/* Opens the menu on phones; collapses the sidebar on desktop (also Ctrl+B) */}
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <span className="text-sm font-medium text-muted-foreground">
        {current?.title ?? 'IdeaBloom'}
      </span>
    </header>
  );
}
