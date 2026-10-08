"use client";

import { useEffect, useLayoutEffect } from "react";
import { useTelegramStore } from "@/stores/telegram";

// React warns if useLayoutEffect runs during SSR (it does nothing there).
// This component is client-only, but Next.js still does a server render
// pass for it, so fall back to useEffect on the server and only use the
// synchronous, pre-paint version in the browser.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        // Native back arrow rendered by the Telegram client itself (not
        // part of our DOM) — used instead of an in-page back button so
        // navigation matches every other Mini App the user has used.
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          isVisible?: boolean;
        };
        // Native full-width CTA anchored above the home indicator —
        // reserved for a future pass wiring primary actions (submit test,
        // save profile) to it instead of in-page submit buttons.
        MainButton?: {
          text: string;
          color?: string;
          textColor?: string;
          isVisible?: boolean;
          isActive?: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        // Client reports its supported Bot API level here (e.g. "6.0",
        // "8.0"...) — version-gated methods below log a console error
        // (not a thrown exception) if called on an unsupported client,
        // so we gate every call on this ourselves instead of relying on
        // optional chaining, which only checks the method *exists*, not
        // that the running client actually supports it.
        version?: string;
        isVersionAtLeast?: (version: string) => boolean;
        // Bot API 8.0+ — true edge-to-edge fullscreen (beyond expand()).
        // Optional because older Telegram clients don't have it yet.
        requestFullscreen?: () => void;
        exitFullscreen?: () => void;
        isFullscreen?: boolean;
        isExpanded?: boolean;
        // Prevents an accidental vertical swipe from collapsing/closing
        // the Mini App — needed so buttons/lists near the top/bottom
        // don't trigger a swipe-to-close.
        disableVerticalSwipes?: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        setBottomBarColor?: (color: string) => void;
        // Opens external URLs via Telegram's own browser/handler instead of
        // a plain <a target="_blank">, which can misbehave inside the
        // Mini App WebView (see lib/utils.ts openExternalLink).
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        viewportHeight?: number;
        viewportStableHeight?: number;
        safeAreaInset?: { top: number; bottom: number; left: number; right: number };
        contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
        platform?: string;
        onEvent: (event: string, cb: () => void) => void;
        offEvent: (event: string, cb: () => void) => void;
        themeParams?: Record<string, string>;
        // Raw signed string — sent as-is to POST /auth/telegram/webapp.
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
}

/**
 * app.enwis.uz — parol bilan kirish asosiy yo'l bo'lib qoladi, LEKIN
 * ilova Telegram Mini App sifatida (Telegram ichidagi WebView'da) ochilsa,
 * `Telegram.WebApp.initData` orqali avtomatik, parolsiz kirish ham
 * qo'llab-quvvatlanadi — bu logikani stores/auth.ts'dagi
 * `loginWithTelegramWebApp` va components/auth/auth-guard.tsx boshqaradi.
 *
 * Bu komponent faqat "chrome" — safe-area, balandlik, header rangi —
 * moslashuvi uchun javobgar.
 *
 * Oddiy brauzerda ochilsa (window.Telegram yo'q) — bu komponent
 * hech narsa qilmaydi, mutlaqo zararsiz no-op.
 */
export function TelegramWebAppAdapter() {
  // useLayoutEffect (not useEffect) — this must set inTelegram=true
  // BEFORE the browser paints. With useEffect, DashboardLayout's very
  // first paint always sees inTelegram=false and picks DesktopLayout
  // (sidebar + Topbar); only after that paint does the effect run and
  // flip it to TelegramLayout. On a wide Telegram Desktop Mini App
  // window (>=768px) that shows up as a visible flash of the desktop
  // topbar/sidebar before it's replaced. useLayoutEffect fires
  // synchronously after DOM mutations but before paint, so the
  // Zustand update (and DashboardLayout's re-render off the back of
  // it) both land before anything is shown on screen.
  useIsomorphicLayoutEffect(() => {
    const tg = window.Telegram?.WebApp;
    // tg.initData (not just tg) is the real signal: the official SDK
    // script defines window.Telegram.WebApp unconditionally in ANY
    // browser once it loads — that object existing does NOT mean the
    // page is actually running inside Telegram. initData is only
    // populated when Telegram itself launched the page as a Mini App;
    // outside Telegram it's always "". Without this check, every plain
    // desktop/mobile browser visit was also being flagged as "in
    // Telegram," forcing the Telegram bottom-nav layout everywhere.
    if (!tg || !tg.initData) return;

    // Everything downstream (Sidebar vs BottomNav, native BackButton,
    // topbar spacing) branches on this single flag.
    useTelegramStore.getState().setInTelegram(true);

    tg.ready();

    // Compare against tg.version ourselves — isVersionAtLeast was only
    // added in 6.1, so on a genuinely old client (like the 6.0 in the
    // error report) it may not exist either. A manual compare works on
    // every version, including the oldest ones.
    const atLeast = (min: string): boolean => {
      if (tg.isVersionAtLeast) return tg.isVersionAtLeast(min);
      const cur = (tg.version ?? "6.0").split(".").map(Number);
      const want = min.split(".").map(Number);
      for (let i = 0; i < Math.max(cur.length, want.length); i++) {
        const a = cur[i] ?? 0;
        const b = want[i] ?? 0;
        if (a !== b) return a > b;
      }
      return true;
    };

    // expand() is available since the very first Bot API version, so it
    // always runs — this alone already gets us most of the way to "wide
    // open" on old clients that don't support fullscreen at all.
    tg.expand();
    if (atLeast("8.0")) {
      tg.requestFullscreen?.();
      tg.setBottomBarColor?.("#f4f7f5");
    }
    if (atLeast("7.7")) tg.disableVerticalSwipes?.();
    if (atLeast("6.2")) tg.enableClosingConfirmation?.();
    if (atLeast("6.1")) {
      tg.setHeaderColor?.("#0f2419");
      tg.setBackgroundColor?.("#f4f7f5");
    }

    const applyViewportHeight = () => {
      const h = tg.viewportStableHeight ?? tg.viewportHeight ?? window.innerHeight;
      document.documentElement.style.setProperty("--tg-viewport-height", `${h}px`);
    };
    const applySafeArea = () => {
      const inset = tg.contentSafeAreaInset ?? tg.safeAreaInset;
      document.documentElement.style.setProperty("--tg-safe-top", `${inset?.top ?? 0}px`);
      document.documentElement.style.setProperty("--tg-safe-bottom-inset", `${inset?.bottom ?? 0}px`);
    };
    applyViewportHeight();
    applySafeArea();
    tg.onEvent("viewportChanged", applyViewportHeight);
    tg.onEvent("safeAreaChanged", applySafeArea);
    tg.onEvent("contentSafeAreaChanged", applySafeArea);
    tg.onEvent("fullscreenChanged", applySafeArea);

    document.documentElement.classList.add("in-telegram");

    return () => {
      tg.offEvent("viewportChanged", applyViewportHeight);
      tg.offEvent("safeAreaChanged", applySafeArea);
      tg.offEvent("contentSafeAreaChanged", applySafeArea);
      tg.offEvent("fullscreenChanged", applySafeArea);
    };
  }, []);

  return null;
}
