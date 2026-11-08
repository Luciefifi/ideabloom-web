'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ApiStatus } from '@/features/system/api-status';
import { UserMenu } from './user-menu';
import {
  isNavItemActive,
  navGroups,
  settingsNavItem,
  type NavItem,
} from './nav-items';

function NavLinkView({ item, active }: { item: NavItem; active: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.title}
        render={
          <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            // On phones the sidebar is a slide-out panel: close it after choosing a page.
            onClick={() => isMobile && setOpenMobile(false)}
          />
        }
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ActiveAwareNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  return <NavLinkView item={item} active={isNavItemActive(item, pathname)} />;
}

/**
 * Reading the URL (usePathname) on dynamic pages like /ideas/[id] must happen
 * inside Suspense. The fallback is the same link, just not highlighted, so
 * the sidebar is always there instantly.
 */
function NavLink({ item }: { item: NavItem }) {
  return (
    <Suspense fallback={<NavLinkView item={item} active={false} />}>
      <ActiveAwareNavLink item={item} />
    </Suspense>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href="/dashboard" aria-label="IdeaBloom home">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <NavLink item={settingsNavItem} />
        </SidebarMenu>
        <UserMenu />
        <ApiStatus />
      </SidebarFooter>

      {/* Thin clickable edge that collapses/expands the sidebar on desktop */}
      <SidebarRail />
    </Sidebar>
  );
}
