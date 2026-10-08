"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DesktopLayout } from "@/layouts/DesktopLayout";
import { MobileLayout } from "@/layouts/MobileLayout";
import { TelegramLayout } from "@/layouts/TelegramLayout";
import { useTelegramStore } from "@/stores/telegram";
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useAuthStore } from "@/stores/auth";
import { ToastProvider } from "@/components/ui/toast";
import { PhoneVerificationBanner } from "@/components/shared/phone-verification-banner";

/**
 * Three genuinely separate layouts, chosen at runtime (screen size +
 * Telegram detection), no page reload required since both signals are
 * reactive client state:
 *  - Telegram Mini App -> TelegramLayout (native header + bottom nav)
 *  - Mobile browser <768px -> MobileLayout (mobile header + bottom nav)
 *  - Tablet/desktop >=768px -> DesktopLayout (sidebar + topbar)
 * Telegram takes priority over width, since a Mini App WebView can be
 * any size but must never show the desktop sidebar/topbar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inTelegram = useTelegramStore((s) => s.inTelegram);
  const isMobile = useIsMobile(768);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  // Native Telegram back arrow on every page except the dashboard home —
  // there's nothing to go "back" to from there. No-op outside Telegram.
  useTelegramBackButton(pathname !== "/");

  // Role and subscription status can change server-side at any moment
  // (subscription expires, TEACHER status granted/revoked) — AuthGuard
  // only fetches /users/me once on initial load, so this component (which
  // persists across dashboard navigations) refreshes it on every route
  // change instead of trusting a stale, session-long cache.
  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const Layout = inTelegram ? TelegramLayout : isMobile ? MobileLayout : DesktopLayout;

  return (
    <AuthGuard>
      <ToastProvider>
        <PhoneVerificationBanner />
        <Layout>{children}</Layout>
      </ToastProvider>
    </AuthGuard>
  );
}
