"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Phone, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { Logo } from "@/components/ui/logo";
import { api, ApiError } from "@/lib/api";

type Step = "phone" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const formatPhone = (val: string) => {
    let v = val.replace(/[^\d+]/g, "");
    if (!v.startsWith("+998")) {
      if (v.startsWith("998")) v = "+" + v;
      else if (v.startsWith("9")) v = "+998" + v.slice(1);
      else v = "+998" + v;
    }
    return v.length <= 13 ? v : v.slice(0, 13);
  };

  const startTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer((p) => {
        if (p <= 1) { clearInterval(iv); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (phone.length < 7) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password/send-code", { phone });
      setStep("reset");
      startTimer();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Noma'lum xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password/send-code", { phone });
      startTimer();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (code.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        phone,
        code,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Noma'lum xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["phone", "reset"] as Step[];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--color-mist)] px-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-[var(--color-volt)]/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full bg-[var(--color-deep)]/10 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center"><Logo /></div>
        </div>

        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-white p-8 shadow-[var(--shadow-soft-md)]">
          {error && (
            <div className="mb-5 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
              {error}
            </div>
          )}

          {step !== "done" && (
            <div className="flex items-center justify-center gap-2 mb-7">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      step === s
                        ? "bg-[var(--color-deep)] text-white"
                        : steps.indexOf(step) > i
                          ? "bg-[var(--color-deep)]/15 text-[var(--color-deep)]"
                          : "bg-[var(--color-mist)] text-[var(--color-slate-light)]"
                    }`}
                  >
                    {steps.indexOf(step) > i ? (
                      <CheckCircle size={14} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 1 && (
                    <div
                      className={`w-8 h-0.5 rounded-full transition-all ${
                        steps.indexOf(step) > i
                          ? "bg-[var(--color-deep)]/30"
                          : "bg-[var(--color-mist)]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === "phone" && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-medium text-[var(--color-ink)]">
                  Parolni tiklash
                </h1>
                <p className="mt-2 text-sm text-[var(--color-slate)]">
                  Telefon raqamingizni kiriting, SMS kod yuboramiz.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Telefon raqam
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
                    <Input
                      type="tel"
                      autoComplete="tel"
                      autoFocus
                      placeholder="+998 90 123 45 67"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={phone.length < 7 || submitting}
                  onClick={handleSendCode}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  SMS kod yuborish
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kirish sahifasiga qaytish
                </Link>
              </div>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="text-center mb-7">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-volt)]/15 mb-4">
                  <Phone className="h-7 w-7 text-[var(--color-deep)]" />
                </div>
                <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-medium text-[var(--color-ink)]">
                  Yangi parol o&apos;rnating
                </h1>
                <p className="mt-2 text-sm text-[var(--color-slate)]">
                  <span className="font-medium text-[var(--color-ink)]">{phone}</span> raqamiga yuborilgan kodni kiriting.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
                    SMS kod
                  </label>
                  <OtpInput length={6} value={code} onChange={setCode} error={!!error} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="Kamida 8 ta belgi"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 8 && (
                    <p className="mt-1.5 text-xs text-[var(--color-danger)]">Kamida 8 ta belgi kerak</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="Parolni qayta kiriting"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    />
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="mt-1.5 text-xs text-[var(--color-danger)]">Parollar mos kelmaydi</p>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={code.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword || submitting}
                  onClick={handleReset}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Parolni yangilash
                </Button>
              </div>

              <div className="mt-5 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-[var(--color-slate)]">
                    Qayta yuborish: <span className="font-medium text-[var(--color-ink)]">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={submitting}
                    className="text-sm text-[var(--color-deep)] font-medium hover:text-[var(--color-deep-800)] transition-colors"
                  >
                    Kodni qayta yuborish
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setCode(""); setError(null); }}
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <ArrowLeft size={16} />
                  Telefon raqamni o&apos;zgartirish
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-volt)]/15 mb-5">
                <CheckCircle className="h-7 w-7 text-[var(--color-deep)]" />
              </div>
              <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-medium text-[var(--color-ink)]">
                Parol yangilandi!
              </h1>
              <p className="mt-2 text-sm text-[var(--color-slate)] mb-7">
                Yangi parolingiz bilan tizimga kirishingiz mumkin.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-deep)] font-medium hover:text-[var(--color-deep-800)] transition-colors"
              >
                Kirish sahifasiga o&apos;tish
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
