'use client';

import Link from 'next/link';
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
import {
  isNavItemActive,
  navGroups,
  settingsNavItem,
  type NavItem,
} from './nav-items';

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const active = isNavItemActive(item, pathname);

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
        <ApiStatus />
      </SidebarFooter>

      {/* Thin clickable edge that collapses/expands the sidebar on desktop */}
      <SidebarRail />
    </Sidebar>
  );
}
