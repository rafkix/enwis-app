"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { DASHBOARD_NAV_ITEMS } from "@/constants";

/**
 * Telegram Mini Apps reserve their own top-left corner for the native
 * back/close chrome, so a fixed hamburger button there (the desktop-web
 * pattern in Sidebar) either overlaps it or gets mistaken for it. A
 * bottom tab bar is the idiomatic pattern instead — always visible, no
 * drawer/overlay, thumb-reachable, and it clears Telegram's own chrome
 * entirely. Rendered only when useTelegramStore().inTelegram is true —
 * see app/(dashboard)/layout.tsx.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  const items = DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex bg-white/95 backdrop-blur-xl border-t border-[var(--color-line)]"
      style={{ paddingBottom: "var(--tg-safe-bottom, 0px)" }}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-200",
              isActive ? "text-[var(--color-deep)]" : "text-[var(--color-slate-light)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.25 : 2} />
            <span className="truncate max-w-full px-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
