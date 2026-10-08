"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { useTelegramStore } from "@/stores/telegram";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "enwis:pwa-install-dismissed";

/**
 * Registers the SW (see public/sw.js) and shows our own install banner
 * instead of relying on Chrome's default (easy-to-miss) address-bar icon —
 * see RESPONSIVE_TELEGRAM_PWA_PROMPTS.md, 21-PROMPT item 6.
 *
 * Never renders inside Telegram Mini App — Telegram has its own concept of
 * "add to home screen" and this event never fires there anyway.
 */
export function PwaManager() {
  const inTelegram = useTelegramStore((s) => s.inTelegram);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal — app still works without offline support.
    });
  }, []);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (inTelegram || dismissed || !installEvent) return null;

  const handleInstall = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--color-ink,#161A2C)] text-white shadow-lg"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Download className="h-4 w-4 shrink-0" />
      <p className="text-sm flex-1">Enwis&apos;ni ilova sifatida o&apos;rnating — tezroq ochiladi.</p>
      <button
        onClick={handleInstall}
        className="text-xs font-semibold rounded-full bg-white text-[var(--color-ink,#161A2C)] px-3 py-1.5 whitespace-nowrap"
      >
        O&apos;rnatish
      </button>
      <button onClick={handleDismiss} aria-label="Yopish" className="p-1 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
