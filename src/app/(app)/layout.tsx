import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopBar } from '@/components/layout/top-bar';
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
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
