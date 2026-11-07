import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** The main navigation. Adding a section to the app = adding one line here. */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Search', href: '/search', icon: Search },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Ideas', href: '/ideas', icon: Lightbulb },
      { title: 'Projects', href: '/projects', icon: FolderKanban },
      { title: 'Tasks', href: '/tasks', icon: ListChecks },
      { title: 'Calendar', href: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Library',
    items: [
      { title: 'Notes', href: '/notes', icon: NotebookPen },
      { title: 'Resources', href: '/resources', icon: Library },
    ],
  },
];

export const settingsNavItem: NavItem = {
  title: 'Settings',
  href: '/settings',
  icon: Settings,
};

export const allNavItems: NavItem[] = [
  ...navGroups.flatMap((group) => group.items),
  settingsNavItem,
];

/** True for the item's own page and anything below it (/ideas and /ideas/123). */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
