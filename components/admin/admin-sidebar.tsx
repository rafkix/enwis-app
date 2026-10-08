"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  GraduationCap,
  Percent,
  BookOpen,
  ScrollText,
  LogOut,
  ArrowLeftRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Boshqaruv paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/payments", label: "To'lovlar", icon: CreditCard },
  { href: "/admin/teacher-purchases", label: "O'qituvchi xaridlari", icon: GraduationCap },
  { href: "/admin/pricing", label: "Narxlar / Promo", icon: Percent },
  { href: "/admin/plans", label: "Rejalar", icon: BookOpen },
  { href: "/admin/cards", label: "Kartalar", icon: CreditCard },
  { href: "/admin/logs", label: "Audit log", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
        <Logo size="sm" href="/admin" dark />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-[var(--radius-lg)] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
          aria-label="Menyuni yopish"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pt-4 pb-1">
        <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--color-volt)]/15 text-[var(--color-volt)] text-[10px] font-semibold uppercase tracking-wide">
          Admin panel
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
            >
              <item.icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors duration-300",
                  isActive ? "text-[var(--color-deep-900)]" : "text-white/40 group-hover:text-white"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
        >
          <ArrowLeftRight size={18} className="shrink-0" />
          <span>Asosiy ilovaga qaytish</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar size="sm" src={user?.avatar} fallback={user?.full_name || ""} className="shrink-0 ring-2 ring-white/20" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || "Admin"}</p>
            <p className="text-xs text-white/50 truncate">{user?.email || user?.username || ""}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium text-white/60 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all duration-300"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-soft-sm)] border border-[var(--color-line)] flex items-center justify-center text-[var(--color-ink)] transition-all duration-300 hover:bg-[var(--color-mist)]"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[var(--color-deep)] border-r border-white/10 z-50 transition-transform duration-300 ease-[var(--ease-editorial)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebar}
      </aside>

      <div className="w-64 shrink-0 hidden lg:block" />
    </>
  );
}
