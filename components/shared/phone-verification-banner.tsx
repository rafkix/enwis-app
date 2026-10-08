"use client";

import { useState } from "react";
import { Phone, Loader2, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// Google/Telegram orqali ro'yxatdan o'tgan, lekin telefonini hali
// tasdiqlamagan foydalanuvchilar uchun doimiy banner.
//
// Eslatma: eski "parolni o'rnating" bildirishnomasi butunlay olib
// tashlangan — endi faqat `requires_phone_verification` tekshiriladi.
// `requires_password_setup` mavjud bo'lsa ham frontend uni ishlatmaydi.
//
// Backendda bu ish uchun alohida "birinchi marta tasdiqlash" endpointi
// yo'q — mavjud POST /users/me/phone/request va POST /users/me/phone/verify
// bo'sh/yangi telefon holatida ham to'g'ri ishlaydi, shuning uchun
// userService.requestPhoneChange/verifyPhoneChange qayta ishlatiladi.
function formatPhone(value: string) {
  let val = value.replace(/[^\d+]/g, "");
  if (!val.startsWith("+998")) {
    if (val.startsWith("998")) val = "+" + val;
    else if (val.startsWith("9")) val = "+998" + val.slice(1);
    else val = "+998" + val;
  }
  return val.length <= 13 ? val : val.slice(0, 13);
}

export function PhoneVerificationBanner() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user?.requires_phone_verification) return null;

  const handleRequest = async () => {
    if (phone.length < 13) return;
    setSubmitting(true);
    try {
      await userService.requestPhoneChange(phone);
      setStep("otp");
      toast.success("Tasdiqlash kodi yuborildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Kod yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await userService.verifyPhoneChange(phone, code);
      await useAuthStore.getState().fetchMe();
      toast.success("Telefon raqam tasdiqlandi");
      setOpen(false);
      setStep("phone");
      setPhone("");
      setCode("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Tasdiqlashda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[var(--color-warning-soft,#FFF7E6)] border-b border-[var(--color-warning,#F5A623)]/30">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        {!open ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <ShieldAlert size={16} className="text-[var(--color-warning,#B7791F)] shrink-0" />
              <span>Telefon raqamingizni tasdiqlang — hisobingiz xavfsizligi uchun muhim.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Phone size={14} />
              Tasdiqlash
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2 py-1">
            {step === "phone" ? (
              <>
                <div className="min-w-[200px] flex-1">
                  <Input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                  />
                </div>
                <Button size="sm" disabled={phone.length < 13 || submitting} onClick={handleRequest}>
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Kod yuborish
                </Button>
              </>
            ) : (
              <>
                <div className="min-w-[160px]">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <Button size="sm" disabled={code.length !== 6 || submitting} onClick={handleVerify}>
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Tasdiqlash
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStep("phone")}>
                  Orqaga
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => {
                setOpen(false);
                setStep("phone");
              }}
              title="Yopish"
            >
              <X size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
