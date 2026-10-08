import { AdminAuthGuard } from "@/components/auth/admin-auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

/**
 * Everything under /admin/* except /admin/login (that page lives one
 * level up, outside this (protected) group, specifically so it is NOT
 * wrapped by AdminAuthGuard — guarding the login page itself would be a
 * redirect loop: not-yet-authenticated -> guard sends to /admin/login ->
 * /admin/login is also guarded -> sends to /admin/login again.
 *
 * .admin-theme (app/globals.css) overrides --color-deep/--color-volt/etc
 * for this whole subtree, so every shared UI component (Button, Badge,
 * Modal...) automatically renders in the admin palette without any
 * per-component change — only the CSS variables they already read
 * resolve differently in here.
 */
export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="admin-theme flex min-h-screen bg-[var(--color-mist)]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1 p-3 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
