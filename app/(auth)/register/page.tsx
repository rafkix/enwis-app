"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Phone,
  CheckCircle,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/stores/auth";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { ApiError } from "@/lib/api";

// Real backend flow (doc section 2.1): full_name + phone + password are
// collected up front, then a single SMS-code step verifies the phone and
// creates the account. There is no separate "pick a username" step -- the
// backend auto-generates it as "ism.familiya".
type Step = "details" | "otp" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const { registerSendCode, registerVerify } = useAuthStore();

  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const canSubmitDetails =
    fullName.trim().length > 1 && phone.length >= 7 && password.length >= 8;

  const handleDetailsSubmit = async () => {
    if (!canSubmitDetails) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerSendCode(fullName.trim(), phone, password);
      setStep("otp");
      setOtp("");
      startResendTimer();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Noma'lum xatolik yuz berdi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerVerify(phone, otp);
      setStep("done");
      setTimeout(() => router.replace("/"), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Ro'yxatdan o'tishda xatolik");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerSendCode(fullName.trim(), phone, password);
      startResendTimer();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    let val = value.replace(/[^\d+]/g, "");
    if (!val.startsWith("+998")) {
      if (val.startsWith("998")) val = "+" + val;
      else if (val.startsWith("9")) val = "+998" + val.slice(1);
      else val = "+998" + val;
    }
    return val.length <= 13 ? val : val.slice(0, 13);
  };

  const steps = ["details", "otp"] as Step[];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — brand panel (hidden on mobile) */}
      <AuthBrandPanel
        title="Bir necha daqiqada hisobingizni yarating."
        description="Ro'yxatdan o'ting va Enwis bilan testlar tuzing, imtihonlar o'tkazing hamda natijalarni real vaqtda kuzating."
      />

      {/* Right — register form */}
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

          {step === "details" && (
            <>
              <div className="text-center mb-7">
                <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-medium leading-tight text-[var(--color-ink)]">
                  Ro&apos;yxatdan o&apos;tish
                </h1>
                <p className="mt-2 text-sm text-[var(--color-slate)]">
                  Ism-familiya, telefon raqam va parolni kiriting. Login
                  avtomatik yaratiladi.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    To&apos;liq ism
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]"
                    />
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Ism Familiya"
                      className="pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Telefon raqam
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]"
                    />
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+998 90 123 45 67"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                    />
                  </div>
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
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Kamida 8 ta belgi"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSubmitDetails)
                          handleDetailsSubmit();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                      Kamida 8 ta belgi kerak
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmitDetails || submitting}
                  onClick={handleDetailsSubmit}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Kod yuborish
                </Button>
              </div>

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
                <GoogleLoginButton onError={setError} />
                <TelegramLoginButton onError={setError} />
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-slate)]">
                  Hisobingiz bormi?{" "}
                  <Link
                    href="/login"
                    className="text-[var(--color-deep)] font-medium hover:text-[var(--color-deep-800)] transition-colors"
                  >
                    Kirish
                  </Link>
                </p>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-7">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-volt)]/15 mb-4">
                  <Phone className="h-7 w-7 text-[var(--color-deep)]" />
                </div>
                <h1 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-medium leading-tight text-[var(--color-ink)]">
                  Tasdiqlash kodi
                </h1>
                <p className="mt-2 text-sm text-[var(--color-slate)]">
                  <span className="font-medium text-[var(--color-ink)]">
                    {phone}
                  </span>{" "}
                  raqamiga yuborilgan 6 xonali kodni kiriting.
                </p>
              </div>

              <div className="mb-6">
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  error={!!error}
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={otp.length !== 6 || submitting}
                onClick={handleOtpSubmit}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Tasdiqlash
              </Button>

              <div className="mt-6 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-[var(--color-slate)]">
                    Qayta yuborish:{" "}
                    <span className="font-medium text-[var(--color-ink)]">
                      {resendTimer}s
                    </span>
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
                  onClick={() => {
                    setStep("details");
                    setOtp("");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <ArrowLeft size={16} />
                  Ma&apos;lumotlarni tahrirlash
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
                Xush kelibsiz!
              </h1>
              <p className="mt-2 text-sm text-[var(--color-slate)]">
                Hisobingiz muvaffaqiyatli yaratildi. Sahifaga
                yo&apos;naltirilmoqda...
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
