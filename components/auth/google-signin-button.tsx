"use client";

import { useEffect, useRef } from "react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth";

type Props = {
  onSuccess: () => void;
  onError: (msg: string) => void;
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

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initedRef = useRef(false);
  const cbRef = useRef<((credential: string) => void) | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    cbRef.current = async (credential: string) => {
      try {
        await authService.linkGoogle(credential);
        await useAuthStore.getState().fetchMe();
        onSuccessRef.current();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ?? "Google hisobini ulashda xatolik";
        onErrorRef.current(msg);
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
        text: "continue_with",
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
    script.onerror = () => onErrorRef.current("Google SDK yuklanmadi.");
    document.body.appendChild(script);
  }, []);

  const handleClick = () => {
    const btn = containerRef.current?.querySelector("div[role='button'], iframe");
    if (btn) (btn as HTMLElement).click();
  };

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 44 }}>
      {/* Google SDK tugmasi — ko'rinmas, lekin DOM da bor */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          pointerEvents: "auto",
          overflow: "hidden",
          borderRadius: 12,
        }}
      />

      {/* Custom tugma — Google tugmasi ustida */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-label="Continue with Google"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          border: "1.5px solid #e4e8f2",
          borderRadius: 12,
          padding: "12px 13px",
          fontSize: 13,
          fontWeight: 500,
          color: "#0c1422",
          background: "#f7f8fd",
          cursor: "pointer",
          minHeight: 44,
          transition: "border-color .16s, box-shadow .16s, background .16s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = "var(--color-volt)";
          el.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--color-volt) 18%, transparent)";
          el.style.background = "var(--color-canvas)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = "#e4e8f2";
          el.style.boxShadow = "none";
          el.style.background = "#f7f8fd";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
