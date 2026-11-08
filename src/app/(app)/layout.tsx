import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { ThemeSync } from '@/components/layout/theme-sync';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

/**
 * Layout for every page inside the app: sidebar on the left, top bar and the
 * page content on the right. The "(app)" folder name is a route group: it
 * organises files without appearing in the URL (/ideas, not /app/ideas).
 * Login and registration pages (Milestone 1) will live in "(auth)" with their
 * own, simpler layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ThemeSync />
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none md:px-6 lg:px-8"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
