"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { DASHBOARD_NAV_ITEMS } from "@/constants";

/**
 * Telegram Mini App header. Intentionally NOT the desktop Topbar in a
 * smaller size — no search bar (search is a bottom-nav tab, the native
 * pattern), no Ctrl+K hint, no drawer spacing. Telegram already renders
 * its own back/close chrome above this, so this is just a slim page-title
 * strip + notification bell so the app still feels native rather than
 * like the desktop website shrunk down. "Optional" per the Telegram UX
 * spec — kept lightweight enough that hiding it later is a one-line change.
 */
export function TelegramHeader() {
  const pathname = usePathname();

  const current =
    DASHBOARD_NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    )?.label ?? "Enwis";

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 h-12 bg-[var(--color-mist)]/95 backdrop-blur-xl"
      style={{ paddingTop: "var(--tg-safe-top, 0px)" }}
    >
      <span className="text-sm font-semibold text-[var(--color-ink)] truncate">{current}</span>
      <NotificationBell compact />
    </header>
  );
}
