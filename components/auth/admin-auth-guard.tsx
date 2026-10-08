"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

/**
 * Gate for everything under app/(admin)/ — deliberately separate from
 * components/auth/auth-guard.tsx (used by the regular product dashboard),
 * because the two guards protect different things:
 *   - AuthGuard: "is anyone logged in"
 *   - AdminAuthGuard: "is the logged-in person an admin"
 *
 * A non-admin who is logged into the regular product and manually visits
 * /admin/* must never see admin content, even for a frame — so this
 * redirects on role as eagerly as fetchMe() resolves, same as AuthGuard
 * does for isAuthenticated, and renders nothing until role is confirmed.
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || role !== "admin") {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading || !isAuthenticated || role !== "admin") {
    return (
      <div className="admin-theme flex items-center justify-center min-h-screen bg-[var(--color-mist)]">
        <div className="w-8 h-8 border-2 border-[var(--color-deep)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
