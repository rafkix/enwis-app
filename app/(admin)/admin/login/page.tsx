"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/lib/api";

// Deliberately minimal compared to the regular /login: no register link,
// no Google/Telegram buttons, no "forgot password" self-service flow.
// Admin accounts are provisioned out-of-band (an existing admin grants
// the role via /admin/users), so this surface only needs to authenticate
// someone who already has credentials — it should not advertise ways to
// create a new account or recover access unassisted.
const schema = z.object({
  identifier: z.string().min(3, "Kamida 3 ta belgi"),
  password: z.string().min(1, "Parolni kiriting"),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await login(data.identifier, data.password);
      // login() populates the store's `role` synchronously (it awaits
      // /users/me itself before resolving), so it's safe to read it here
      // right after — no extra fetchMe() round trip needed.
      if (useAuthStore.getState().role !== "admin") {
        // Real credentials, but this account isn't an admin — the shared
        // cookie/token is now set for a non-privileged account, which
        // must not silently sit there granting access if they later
        // navigate straight to /admin. Log back out immediately.
        await logout();
        setError("Bu hisobda admin huquqi yo'q");
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Noma'lum xatolik yuz berdi");
    }
  };

  return (
    <div className="admin-theme relative min-h-screen flex items-center justify-center bg-[var(--color-mist)] px-4 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-[var(--color-volt)]/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full bg-[var(--color-deep)]/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex justify-center">
            <Logo href="/admin/login" />
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--color-deep)]/10 text-[var(--color-deep)] text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck size={13} />
            Admin panel
          </div>
          <h1 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Boshqaruv paneliga kirish
          </h1>
        </div>

        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-8 shadow-[var(--shadow-soft-md)]">
          {error && (
            <div className="mb-5 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Login</label>
              <Input
                {...form.register("identifier")}
                type="text"
                autoComplete="username"
                placeholder="ism.familiya"
                autoFocus
              />
              {form.formState.errors.identifier && (
                <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                  {form.formState.errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Parol</label>
              <div className="relative">
                <Input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Kirish
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-slate-light)]">
          Bu — Enwis boshqaruv paneli. Oddiy foydalanuvchi hisobi bilan kira olmaysiz.
        </p>
      </div>
    </div>
  );
}
