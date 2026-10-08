"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronLeft, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { DASHBOARD_NAV_ITEMS } from "@/constants";

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobil menyu ochiq holda foydalanuvchi biror Link'ni bossa, yangi sahifa
  // ustida menyu ochiq qolib ketmasligi uchun marshrut o'zgarganda avtomatik yopiladi.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visibleNavItems = DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
        <Logo size="sm" showText={!collapsed} dark />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-[var(--radius-lg)] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
        >
          <ChevronLeft
            size={16}
            className={cn("transition-transform duration-300", collapsed && "rotate-180")}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-[var(--radius-lg)] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
          aria-label="Menyuni yopish"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-[var(--color-volt)] text-[var(--color-deep-900)] shadow-[var(--shadow-soft-sm)]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors duration-300",
                  isActive ? "text-[var(--color-deep-900)]" : "text-white/40 group-hover:text-white"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        <div className={cn("flex items-center gap-3 px-3 py-2.5", collapsed && "justify-center")}>
          <Avatar
            size="sm"
            src={user?.avatar}
            fallback={user?.full_name || ""}
            className="shrink-0 ring-2 ring-white/20"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || "Foydalanuvchi"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.email || user?.username || ""}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium text-white/60 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all duration-300 mt-1",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-soft-sm)] border border-[var(--color-line)] flex items-center justify-center text-[var(--color-ink)] transition-all duration-300 hover:bg-[var(--color-mist)]"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[var(--color-deep)] border-r border-white/10 z-50 transition-all duration-300 ease-[var(--ease-editorial)]",
          collapsed ? "w-[68px]" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebar}
      </aside>

      {/* Spacer */}
      <div
        className={cn(
          "transition-all duration-300 ease-[var(--ease-editorial)] shrink-0 hidden lg:block",
          collapsed ? "w-[68px]" : "w-60"
        )}
      />
    </>
  );
}
