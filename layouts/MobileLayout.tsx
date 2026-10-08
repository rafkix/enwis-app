import { MobileHeader } from "@/components/dashboard/mobile-header";
import { BottomNav } from "@/components/dashboard/bottom-nav";

/**
 * Mobile browser (<768px), outside Telegram: no sidebar, no desktop
 * top bar — a compact mobile header plus a fixed bottom tab bar. Content
 * gets bottom padding equal to the nav height so it's never covered, and
 * top/bottom safe-area insets are handled inside MobileHeader/BottomNav.
 */
export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <MobileHeader />
      <main
        className="flex-1 w-full p-4"
        style={{ paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
