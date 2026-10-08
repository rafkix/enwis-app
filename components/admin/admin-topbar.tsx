"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";

export function AdminTopbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-[var(--color-line)] bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
      <div className="lg:hidden w-10" /> {/* space for the mobile hamburger button */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="w-px h-6 bg-[var(--color-line)]" />
        <Avatar size="sm" src={user?.avatar} fallback={user?.full_name || ""} />
      </div>
    </header>
  );
}
