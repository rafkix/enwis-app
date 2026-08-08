"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth";
import type { TelegramAuthPayload } from "@/lib/types";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

type Props = {
  onError?: (msg: string) => void;
  children?: React.ReactNode;
};

export function TelegramLoginButton({ onError, children }: Props) {
  const router = useRouter();
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    window.onTelegramAuth = async (userData: TelegramAuthPayload) => {
      try {
        await authService.telegramLogin(userData);
        await useAuthStore.getState().fetchMe();
        if (useAuthStore.getState().role === "admin") {
          await useAuthStore.getState().logout();
          onErrorRef.current?.("Admin hisoblari faqat Admin panel orqali kiradi.");
          return;
        }
        router.replace("/");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ?? "Telegram orqali kirishda xatolik";
        onErrorRef.current?.(msg);
      }
    };
    return () => {
      delete window.onTelegramAuth;
    };
  }, [router]);

  const handleClick = useCallback(() => {
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "";
    const origin = window.location.origin;
    if (!botId) {
      onErrorRef.current?.("Telegram bot ID sozlanmagan. @BotFather dan oling va .env faylga NEXT_PUBLIC_TELEGRAM_BOT_ID ni yozing.");
      return;
    }
    const url = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(origin)}&request_access=write`;
    window.open(url, "telegram_oauth", "width=550,height=470");
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Telegram orqali kirish"
      className="group flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-[13px] font-semibold text-[var(--color-ink)] shadow-[0_1px_2px_rgba(12,20,34,0.05)] transition-all duration-200 hover:-translate-y-px hover:border-[#26A5E4]/40 hover:bg-[var(--color-mist)] hover:shadow-[0_4px_12px_rgba(38,165,228,0.15)] active:translate-y-0 active:shadow-none"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-mist)] transition-colors group-hover:bg-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.48.7-.96.44l-2.64-1.95-1.28 1.23c-.14.14-.26.26-.54.26l.19-2.7 4.93-4.46c.21-.19-.05-.29-.33-.1L7.9 14.4l-2.59-.81c-.56-.18-.57-.56.12-.83l10.12-3.9c.47-.17.88.11.73.83l-.64-.89z"
            fill="#26A5E4"
          />
        </svg>
      </span>
      {children || "Telegram"}
    </button>
  );
}
