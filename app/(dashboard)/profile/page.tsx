"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  User,
  Camera,
  Save,
  Loader2,
  Mail,
  Phone,
  Copy,
  Check,
  Gift,
  Monitor,
  Trash2,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth";
import { userService } from "@/services/user.service";
import { subscriptionService } from "@/services/subscription.service";
import { api, ApiError } from "@/lib/api";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { ReferralSummary, SessionResponse, AiUsage, MySubscriptionResponse } from "@/lib/types";

const profileSchema = z.object({
  full_name: z.string().min(1, "Ism kiritilishi shart").max(255),
  bio: z.string().max(500).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ── Phone change (doc §3: POST /users/me/phone/request + /verify) ────────
function PhoneChangeCard() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    let val = value.replace(/[^\d+]/g, "");
    if (!val.startsWith("+998")) {
      if (val.startsWith("998")) val = "+" + val;
      else if (val.startsWith("9")) val = "+998" + val.slice(1);
      else val = "+998" + val;
    }
    return val.length <= 13 ? val : val.slice(0, 13);
  };

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
      toast.success("Telefon raqam yangilandi");
      setEditing(false);
      setStep("phone");
      setPhone("");
      setCode("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Tasdiqlashda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
            <Phone size={16} className="text-[var(--color-slate)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-ink)]">Telefon</p>
            <p className="text-sm text-[var(--color-slate)] truncate">{user?.phone || "Belgilanmagan"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.phone_verified ? "success" : "default"}>
            {user?.phone_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            O&apos;zgartirish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] space-y-3">
      {step === "phone" ? (
        <>
          <Label className="block text-sm font-medium text-[var(--color-ink)]">
            Yangi telefon raqam
          </Label>
          <Input
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={phone.length < 13 || submitting} onClick={handleRequest}>
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Kod yuborish
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Bekor qilish
            </Button>
          </div>
        </>
      ) : (
        <>
          <Label className="block text-sm font-medium text-[var(--color-ink)]">
            {phone} raqamiga yuborilgan kod
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={code.length !== 6 || submitting} onClick={handleVerify}>
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Tasdiqlash
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep("phone")}>
              Orqaga
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Plan & limits (doc: GET /subscriptions/me + GET /users/me/ai-usage) ───
function LimitsCard() {
  const [sub, setSub] = useState<MySubscriptionResponse | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [state, setState] = useState<"loading" | "error" | "success">("loading");

  const load = () => {
    setState("loading");
    Promise.all([
      subscriptionService.me().catch(() => null),
      userService.aiUsage().then((res) => res.data ?? (res as unknown as AiUsage)),
    ])
      .then(([subRes, usageRes]) => {
        setSub(subRes);
        setUsage(usageRes);
        setState("success");
      })
      .catch(() => setState("error"));
  };

  useEffect(load, []);

  const tierLabel: Record<string, string> = {
    free: "Bepul",
    teacher: "Teacher",
    pro: "Pro",
    premium: "Premium",
  };

  const isUnlimited = usage?.ai_questions_monthly_limit === -1;
  const usedPercent =
    usage && !isUnlimited && usage.ai_questions_monthly_limit > 0
      ? (usage.ai_questions_used / usage.ai_questions_monthly_limit) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown size={18} className="text-[var(--color-deep)]" />
          Tarif va limitlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {state === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        )}

        {state === "error" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-danger)]">Yuklashda xatolik</p>
            <Button variant="outline" size="sm" onClick={load}>
              <RotateCcw size={14} />
              Qayta urinish
            </Button>
          </div>
        )}

        {state === "success" && usage && (
          <>
            {/* Current plan */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={sub?.active ? "success" : "default"}>
                  {tierLabel[usage.tier] || usage.tier}
                </Badge>
                {usage.is_custom_quota && (
                  <Badge variant="default">Maxsus kvota</Badge>
                )}
                {sub?.expires_at && (
                  <span className="text-xs text-[var(--color-slate)]">
                    {new Date(sub.expires_at).toLocaleDateString("uz-UZ")} gacha
                  </span>
                )}
              </div>
              <Link
                href="/billing"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-deep)] hover:underline shrink-0"
              >
                Tarifni yangilash
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {/* AI quota */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-[var(--color-ink)] font-medium">
                  <Sparkles size={14} className="text-[var(--color-deep)]" />
                  AI savollar
                </span>
                <span className="text-[var(--color-slate)]">
                  {isUnlimited
                    ? "Cheksiz"
                    : `${usage.ai_questions_used} / ${usage.ai_questions_monthly_limit}`}
                </span>
              </div>
              {!isUnlimited && (
                <Progress value={usedPercent} max={100} />
              )}
              {!usage.has_ai_access && (
                <p className="text-xs text-[var(--color-danger)]">
                  Joriy tarifingizda AI savol generatsiyasi mavjud emas.
                </p>
              )}
              {usage.has_ai_access && !isUnlimited && usage.ai_questions_remaining <= 0 && (
                <p className="text-xs text-[var(--color-danger)]">
                  Oylik limit tugadi. Yangilanish sanasi:{" "}
                  {new Date(usage.ai_questions_reset_at).toLocaleDateString("uz-UZ")}
                </p>
              )}
            </div>

            {/* Tests used, if a subscription record exists */}
            {sub?.tests_used !== undefined && (
              <div className="flex items-center justify-between text-sm pt-1 border-t border-[var(--color-line)]">
                <span className="text-[var(--color-slate)]">Ishlatilgan testlar</span>
                <span className="font-medium text-[var(--color-ink)]">{sub.tests_used}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Referral (doc §3: GET /users/me/referral) ─────────────────────────────
function ReferralCard() {
  const { toast } = useToast();
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [state, setState] = useState<"loading" | "error" | "success">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    userService
      .referral()
      .then((res) => {
        setData(res.data ?? (res as unknown as ReferralSummary));
        setState("success");
      })
      .catch(() => setState("error"));
  }, []);

  const handleCopy = () => {
    const value = data?.referral_url || data?.referral_code;
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Nusxalandi");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift size={18} className="text-[var(--color-deep)]" />
          Referral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "loading" && <Skeleton className="h-10 w-full" />}
        {state === "error" && (
          <p className="text-sm text-[var(--color-slate)]">
            Referral ma&apos;lumotini yuklab bo&apos;lmadi.
          </p>
        )}
        {state === "success" && data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
              <code className="font-mono text-sm truncate min-w-0">{data.referral_code}</code>
              <button
                onClick={handleCopy}
                className="rounded-full p-1.5 text-[var(--color-slate)] hover:bg-[var(--color-mist)] transition-colors shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-sm text-[var(--color-slate)]">
              Taklif qilingan foydalanuvchilar: <strong>{data.invited_count}</strong>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sessions (doc §3: GET/DELETE /users/me/sessions) ──────────────────────
function SessionsCard() {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "success">("loading");

  const load = () => {
    setState("loading");
    userService
      .sessions()
      .then((res) => {
        setSessions(res.data ?? (res as unknown as SessionResponse[]));
        setState("success");
      })
      .catch(() => setState("error"));
  };

  useEffect(load, []);

  const handleRevoke = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Sessiyani bekor qilish",
      description: "Bu qurilmadagi sessiyani bekor qilishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Bekor qilish",
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    try {
      await userService.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sessiya bekor qilindi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Bekor qilishda xatolik");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor size={18} className="text-[var(--color-deep)]" />
          Sessiyalar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-danger)]">Yuklashda xatolik</p>
            <Button variant="outline" size="sm" onClick={load}>
              <RotateCcw size={14} />
              Qayta urinish
            </Button>
          </div>
        )}
        {state === "success" && sessions.length === 0 && (
          <p className="text-sm text-[var(--color-slate)]">Faol sessiyalar topilmadi</p>
        )}
        {state === "success" &&
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)] break-words">
                  {s.user_agent || "Noma'lum qurilma"}
                </p>
                <p className="text-xs text-[var(--color-slate-light)] break-words">
                  {s.ip_address || "IP noma'lum"} ·{" "}
                  {s.last_used_at
                    ? `oxirgi faollik: ${new Date(s.last_used_at).toLocaleDateString("uz-UZ")}`
                    : "faollik yo'q"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleRevoke(s.id)}
                title="Bekor qilish"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

function ProfilePageContent() {
  const user = useAuthStore((s) => s.user);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || "",
      bio: "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      await api.put("/users/me", {
        full_name: data.full_name,
        meta: data.bio ? { bio: data.bio } : undefined,
      });
      await useAuthStore.getState().fetchMe();
      toast.success("Profil yangilandi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Saqlashda xatolik");
    }
  };

  const MAX_AVATAR_MB = 5;
  const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input immediately so selecting the same file again (e.g.
    // after fixing a validation error) still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Faqat JPG, PNG, WEBP yoki GIF formatidagi rasm yuklang");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Rasm hajmi ${MAX_AVATAR_MB}MB dan oshmasligi kerak`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await api.upload("/users/me/avatar/upload", fd);
      await useAuthStore.getState().fetchMe();
      toast.success("Avatar yangilandi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Avatar yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Profil
          </h1>
          <p className="text-[var(--color-slate)] mt-1">
            Shaxsiy ma&apos;lumotlaringizni boshqaring
          </p>
        </div>
        <Link
          href="/profile/settings"
          aria-label="Sozlamalar"
          className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] h-11 w-11 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-deep)] transition-colors shrink-0"
        >
          <SettingsIcon size={16} />
          <span className="hidden sm:inline">Sozlamalar</span>
        </Link>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <label
              className={`relative group shrink-0 rounded-full ${uploading ? "cursor-wait" : "cursor-pointer"}`}
            >
              <Avatar
                size="xl"
                src={user?.avatar}
                fallback={user?.full_name || ""}
                className="ring-4 ring-[var(--color-deep)]/20"
              />
              {/* Full-circle hover overlay (desktop/mouse) — makes the
                  whole avatar an obvious click target, not just the tiny
                  corner badge. The corner badge stays too, since hover
                  states don't exist on touch. */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--color-volt)] text-[var(--color-deep-900)] flex items-center justify-center shadow-sm">
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={handleAvatarUpload}
              />
            </label>
            <div className="min-w-0">
              <h2 className="text-xl font-medium text-[var(--color-ink)] truncate">
                {user?.full_name || "Foydalanuvchi"}
              </h2>
              <p className="text-sm text-[var(--color-slate)]">
                @{user?.username || "username"}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="default">{role}</Badge>
                ))}
              </div>
              <p className="text-xs text-[var(--color-slate-light)] mt-3">
                JPG, PNG, WEBP yoki GIF — {MAX_AVATAR_MB}MB gacha
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} className="text-[var(--color-deep)]" />
            Shaxsiy ma&apos;lumotlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                To&apos;liq ism
              </Label>
              <Input {...form.register("full_name")} type="text" />
              {form.formState.errors.full_name && (
                <p className="text-xs text-[var(--color-danger)] mt-1">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Bio
              </Label>
              <textarea
                className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30 min-h-[80px]"
                placeholder="O'zingiz haqida qisqacha..."
                {...form.register("bio")}
              />
              <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                Maksimal 500 belgi
              </p>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Saqlash
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={18} className="text-[var(--color-deep)]" />
            Kontakt ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                <Mail size={16} className="text-[var(--color-slate)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)]">Email</p>
                <p className="text-sm text-[var(--color-slate)] truncate">{user?.email || "Belgilanmagan"}</p>
              </div>
            </div>
            <Badge variant={user?.email && user?.is_google_verified ? "success" : "default"}>
              {user?.email && user?.is_google_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
            </Badge>
          </div>
          {(user?.is_google_verified || user?.is_telegram_verified) && (
            <div className="flex flex-wrap items-center gap-2">
              {user?.is_google_verified && (
                <Badge variant="success">Google orqali tasdiqlangan</Badge>
              )}
              {user?.is_telegram_verified && (
                <Badge variant="success">Telegram orqali tasdiqlangan</Badge>
              )}
            </div>
          )}
          <PhoneChangeCard />
        </CardContent>
      </Card>

      <ReferralCard />
      <LimitsCard />
      <SessionsCard />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <ProfilePageContent />
      </ToastProvider>
    </DialogProvider>
  );
}