"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, User, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/stores/auth";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// app.enwis.uz'da asosiy kirish yo'li — username + parol.
// QO'SHIMCHA RAVISHDA: agar sahifa Telegram Mini App (WebView) ichida
// ochilgan bo'lsa, pastdagi useEffect Telegram.WebApp.initData orqali
// avtomatik, parolsiz kirishga harakat qiladi — muvaffaqiyatli bo'lsa,
// bu forma umuman ko'rinmaydi, foydalanuvchi to'g'ridan-to'g'ri boshqaruv
// paneliga tushadi. Muvaffaqiyatsiz bo'lsa (yoki oddiy brauzerda ochilsa),
// forma odatdagidek ko'rsatiladi.
const passwordSchema = z.object({
  identifier: z.string().min(3, "Kamida 3 ta belgi"),
  password: z.string().min(1, "Parolni kiriting"),
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, loginWithTelegramWebApp, telegramAuthError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminBlocked, setAdminBlocked] = useState(false);
  const [checkingTelegram, setCheckingTelegram] = useState(true);
  const [inTelegram, setInTelegram] = useState(false);

  const pwForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    let mounted = true;
    const tryTelegramAutoLogin = async () => {
      const initData = window.Telegram?.WebApp?.initData;
      // See components/telegram-webapp-adapter.tsx: tg being defined
      // doesn't mean we're inside Telegram — the SDK script defines it
      // everywhere. initData is the real signal.
      setInTelegram(!!initData);
      if (initData) {
        const photoUrl = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
        const ok = await loginWithTelegramWebApp(initData, photoUrl);
        if (!mounted) return;
        if (ok) {
          // login() itself doesn't know or care which page called it —
          // that's the right separation of concerns, since /admin/login
          // uses the exact same store method. The regular /login surface
          // is the one place that must not let an admin session through,
          // so the check (and the resulting logout) lives here.
          if (useAuthStore.getState().role === "admin") {
            await logout();
            setAdminBlocked(true);
            setError("Admin hisoblari faqat Admin panel orqali kiradi.");
            setCheckingTelegram(false);
            return;
          }
          router.replace("/");
          return;
        }
      }
      setCheckingTelegram(false);
    };
    tryTelegramAutoLogin();
    return () => {
      mounted = false;
    };
  }, [loginWithTelegramWebApp, router]);

  const onPasswordSubmit = async (data: PasswordForm) => {
    setError(null);
    setAdminBlocked(false);
    try {
      await login(data.identifier, data.password);
      // Same reasoning as the Telegram branch above: login() is shared
      // with /admin/login and must stay agnostic about the caller, so
      // the "no admins here" policy is enforced at this call site.
      if (useAuthStore.getState().role === "admin") {
        await logout();
        setError("Admin hisoblari faqat Admin panel orqali kiradi.");
        setAdminBlocked(true);
        return;
      }
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Noma'lum xatolik yuz berdi");
      }
    }
  };

  // Telegram orqali avtomatik kirish tekshirilayotgan payt — parol
  // formasini bir zumga ko'rsatib, keyin yashirib qo'ymaslik uchun.
  if (checkingTelegram) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-mist)]">
        <div className="w-8 h-8 border-2 border-[var(--color-deep)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — login form */}
      <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-mist)] px-4 py-12 lg:min-h-0 overflow-hidden">
        {/* Ambient layered background — only needed on mobile now that the
            left panel carries the brand visual on desktop. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-[var(--color-volt)]/15 blur-[120px] lg:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full bg-[var(--color-deep)]/10 blur-[100px] lg:hidden"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex justify-center">
              <Logo />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
              Tizimga kirish
            </h1>
            <p className="mt-2 text-sm text-[var(--color-slate)]">
              Hisobingizga kirish uchun ma&apos;lumotlaringizni kiriting
            </p>
          </div>

          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-white p-8 shadow-[var(--shadow-soft-md)]">
            {inTelegram && telegramAuthError && (
              <div className="mb-5 p-3.5 rounded-[var(--radius-lg)] bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono break-words">
                <p className="font-sans font-semibold text-sm mb-1">
                  Telegram orqali avtomatik kirish ishlamadi:
                </p>
                {telegramAuthError}
              </div>
            )}
            {error && (
              <div className="mb-5 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
                <p>{error}</p>
                {adminBlocked && (
                  <Link
                    href="/admin/login"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:text-[var(--color-danger)]/80"
                  >
                    Admin panelga o&apos;tish →
                  </Link>
                )}
              </div>
            )}

            <form
              onSubmit={pwForm.handleSubmit(onPasswordSubmit)}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                  Login
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]"
                  />
                  <Input
                    {...pwForm.register("identifier")}
                    type="text"
                    autoComplete="username"
                    autoFocus
                    placeholder="ism.familiya"
                    className="pl-10"
                  />
                </div>
                {pwForm.formState.errors.identifier && (
                  <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                    {pwForm.formState.errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                  Parol
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]"
                  />
                  <Input
                    {...pwForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[var(--color-deep)] hover:text-[var(--color-deep-800)] font-medium transition-colors"
                >
                  Parolni unutdingizmi?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={pwForm.formState.isSubmitting}
              >
                {pwForm.formState.isSubmitting && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Kirish
              </Button>

              <Link
                href="/register"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                  }),
                  "group relative flex h-11 w-full items-center justify-center overflow-hidden",
                )}
              >
                <span className="absolute transition-all duration-300 ease-in-out group-hover:-translate-y-8 group-hover:opacity-0">
                  Ro&apos;yxatdan o&apos;ting
                </span>

                <span className="absolute translate-y-8 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 text-sm">
                  Hisobingiz yo&apos;qmi?
                </span>
              </Link>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-line)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-[var(--color-slate-light)]">
                  Yoki davom eting
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <GoogleLoginButton />
              <TelegramLoginButton />
            </div>
          </div>
        </div>
      </div>

      {/* Right — brand panel (hidden on mobile) */}
      <AuthBrandPanel
        title="Testlaringizni yarating, kuzating, tahlil qiling."
        description="Enwis bilan savol banklarini boshqaring, imtihonlarni rejalashtiring va o'quvchilar natijalarini bir joyda ko'ring."
      />
    </div>
  );
}
