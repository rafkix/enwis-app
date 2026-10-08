"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchMe, loginWithTelegramWebApp } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      // Telegram Mini App ichida ochilgan bo'lsa, avval initData orqali
      // parolsiz avtomatik kirishga harakat qilamiz. Bu shart bajarilmasa
      // yoki muvaffaqiyatsiz bo'lsa, oddiy cookie-based auth tekshiruviga
      // (fetchMe) tushamiz — asosiy parol bilan kirish yo'li o'zgarmaydi.
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        const photoUrl = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
        const ok = await loginWithTelegramWebApp(initData, photoUrl);
        if (!mounted) return;
        if (ok) return;
      }
      await fetchMe();
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [fetchMe, loginWithTelegramWebApp]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--color-deep)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
