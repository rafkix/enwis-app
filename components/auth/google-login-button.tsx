"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setAuthTokens } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth";

type Props = {
  onError?: (msg: string) => void;
  children?: React.ReactNode;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({ onError, children }: Props) {
  const router = useRouter();
  const onErrorRef = useRef(onError);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initedRef = useRef(false);
  const cbRef = useRef<((credential: string) => void) | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    cbRef.current = async (credential: string) => {
      try {
        const tokens = await authService.googleLogin(credential);
        setAuthTokens(tokens);
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
            ?.response?.data?.detail ?? "Google orqali kirishda xatolik";
        onErrorRef.current?.(msg);
      }
    };

    const initGoogle = () => {
      if (!window.google || !containerRef.current || initedRef.current) return;
      initedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          cbRef.current?.(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current?.offsetWidth || 362,
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    if (window.google) {
      initGoogle();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", initGoogle);
      return () => existing.removeEventListener("load", initGoogle);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => onErrorRef.current?.("Google SDK yuklanmadi.");
    document.body.appendChild(script);
  }, [router]);

  const handleClick = () => {
    const btn = containerRef.current?.querySelector("div[role='button'], iframe");
    if (btn) (btn as HTMLElement).click();
  };

  return (
    <div className="relative min-h-11 w-full">
      {/* Google's real rendered button stays invisible on top-hidden layer;
          our styled button proxies the click to it. */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden rounded-[var(--radius-lg)] opacity-0"
      />
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-label="Google orqali kirish"
        className="group flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-[13px] font-semibold text-[var(--color-ink)] shadow-[0_1px_2px_rgba(12,20,34,0.05)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-deep)]/25 hover:bg-[var(--color-mist)] hover:shadow-[0_4px_12px_rgba(12,20,34,0.08)] active:translate-y-0 active:shadow-none"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-mist)] transition-colors group-hover:bg-white">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </span>
        {children || "Google"}
      </button>
    </div>
  );
}
