import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

/**
 * Desktop (>=1024px) and tablet (768-1023px): left sidebar + top bar.
 * Sidebar handles its own collapse (desktop) / drawer (tablet) behavior
 * internally via the `lg:` breakpoint.
 */
export function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-mist)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
