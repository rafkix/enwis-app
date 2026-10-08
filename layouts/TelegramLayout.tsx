import { TelegramHeader } from "@/components/dashboard/telegram-header";
import { BottomNav } from "@/components/dashboard/bottom-nav";

/**
 * Telegram Mini App: no sidebar, no desktop top bar — a slim native-style
 * header plus a fixed bottom tab bar that's always visible. Uses
 * `--tg-safe-*` custom properties (set by TelegramWebAppAdapter from
 * `Telegram.WebApp.safeAreaInset`/`contentSafeAreaInset`) instead of the
 * plain CSS `env()` insets MobileLayout uses, since Telegram's own chrome
 * (and, on Bot API 8.0+, true fullscreen) changes what's actually safe.
 */
export function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-tg-screen flex-col bg-mist">
      <TelegramHeader />
      <main
        className="flex-1 w-full p-4"
        style={{ paddingBottom: "calc(4.75rem + var(--tg-safe-bottom, 0px))" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
