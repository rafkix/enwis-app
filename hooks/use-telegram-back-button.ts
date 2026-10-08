"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegramStore } from "@/stores/telegram";

/**
 * Shows Telegram's native back arrow (rendered by the Telegram client
 * itself, not our DOM) whenever `enabled` is true and the app is running
 * as a Mini App. Tapping it runs `onBack` if given, otherwise
 * `router.back()`. Automatically hidden again when `enabled` flips to
 * false or the component unmounts — call this once per route/layout,
 * gating `enabled` on e.g. `pathname !== "/"` so the home screen has no
 * back target.
 *
 * No-op outside Telegram (inTelegram === false), so it's safe to call
 * unconditionally from shared layouts that also render in a regular
 * browser.
 */
export function useTelegramBackButton(enabled: boolean, onBack?: () => void) {
  const inTelegram = useTelegramStore((s) => s.inTelegram);
  const router = useRouter();

  useEffect(() => {
    if (!inTelegram) return;
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    if (!enabled) {
      backButton.hide();
      return;
    }

    const handleClick = () => {
      if (onBack) onBack();
      else router.back();
    };

    backButton.onClick(handleClick);
    backButton.show();

    return () => {
      backButton.offClick(handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTelegram, enabled]);
}
