"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, ShieldCheck, User, Lock, Mail, Phone, LogOut, Settings, Bell, Globe, Award, GraduationCap, Briefcase, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { api, ApiError } from "@/lib/api";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
// import { GoogleLinkButton } from "@/components/auth/google-link-button";
// import { TelegramLinkButton } from "@/components/auth/telegram-link-button";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useNotificationPermission } from "@/hooks/use-notifications";
import { BellRing, BellOff, ShieldAlert } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(1).max(255),
  username: z.string().min(3).max(30).optional().or(z.literal("")),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Joriy parolni kiriting"),
  new_password: z.string().min(8, "Yangi parol kamida 8 ta belgi bo'lishi kerak"),
});

const phoneSchema = z.object({
  phone: z.string().min(7, "Telefon raqamni to'liq kiriting").max(20),
});

const verifyPhoneSchema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().min(4).max(8),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;
type VerifyPhoneForm = z.infer<typeof verifyPhoneSchema>;

function SettingsPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showConfirm = useConfirm();
  const { toast } = useToast();

  // Profile tab
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || "",
      username: user?.username || "",
    },
  });

  // Password tab
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Phone tab
  const [phoneStep, setPhoneStep] = useState<"request" | "verify">("request");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
  });
  const verifyPhoneForm = useForm<VerifyPhoneForm>({
    resolver: zodResolver(verifyPhoneSchema),
  });

  // Sessions tab
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Settings tab
  const [userSettings, setUserSettings] = useState({
    language: "uz",
    timezone: "Asia/Tashkent",
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    marketing_consent: false,
  });

  // Brauzer bildirishnoma ruxsati — bu backend'dagi "push_notifications"
  // sozlamasidan ALOHIDA narsa: u faqat foydalanuvchining o'zi shu
  // brauzer/qurilmada Notification API'ga ruxsat berganini bildiradi.
  const {
    isSupported: browserNotifSupported,
    isRequesting: browserNotifRequesting,
    requestPermission: requestBrowserNotifPermission,
    isGranted: browserNotifGranted,
    isDenied: browserNotifDenied,
  } = useNotificationPermission();
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Linked accounts (Google / Telegram) — link status comes straight from
  // `user` (is_google_verified / is_telegram_verified / telegram_id), never
  // cached separately, so it can't go stale relative to the backend.
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);

  const handleUnlinkGoogle = async () => {
    const ok = await showConfirm({
      title: "Google hisobini uzish",
      description: "Google hisobingiz profildan uzib qo'yiladi. Agar parolingiz o'rnatilmagan bo'lsa, kirish uchun Telegram yoki telefon raqamingizdan foydalanishingiz kerak bo'ladi.",
      confirmText: "Uzish",
      variant: "danger",
    });
    if (!ok) return;
    setUnlinkingGoogle(true);
    try {
      await authService.unlinkGoogle();
      await useAuthStore.getState().fetchMe();
      toast.success("Google hisobi uzildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Google hisobini uzishda xatolik");
    } finally {
      setUnlinkingGoogle(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    const ok = await showConfirm({
      title: "Telegram hisobini uzish",
      description: "Telegram hisobingiz profildan uzib qo'yiladi. Agar parolingiz o'rnatilmagan bo'lsa, kirish uchun Google yoki telefon raqamingizdan foydalanishingiz kerak bo'ladi.",
      confirmText: "Uzish",
      variant: "danger",
    });
    if (!ok) return;
    setUnlinkingTelegram(true);
    try {
      await authService.unlinkTelegram();
      await useAuthStore.getState().fetchMe();
      toast.success("Telegram hisobi uzildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Telegram hisobini uzishda xatolik");
    } finally {
      setUnlinkingTelegram(false);
    }
  };

  // Teacher role
  const [becomingTeacher, setBecomingTeacher] = useState(false);
  const [teacherStatus, setTeacherStatus] = useState<any>(null);
  const [teacherStatusLoading, setTeacherStatusLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setTeacherStatusLoading(true);
      try {
        const res = await userService.teacherStatus();
        setTeacherStatus(res.data);
      } catch {
        // non-fatal
      } finally {
        setTeacherStatusLoading(false);
      }
    };
    load();
  }, []);

  const handleBecomeTeacher = () => {
    // Teacher role now requires purchasing the Teacher Package
    router.push("/billing");
  };

  const handleVerifySuccess = async () => {
    try {
      await useAuthStore.getState().becomeTeacher();
      toast.success("Tasdiqlandi! Siz endi o'qituvchi rolidasiz.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Tasdiqlash yakunlanmadi");
    }
  };

  const handleVerifyError = (msg: string) => {
    toast.error(msg);
  };

  // Helper to format date
  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseUserAgent = (ua: string) => {
    let browser = "Noma'lum brauzer";
    let os = "Noma'lum OS";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";
    return { browser, os };
  };

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.get<{ data: any[] }>("/users/me/sessions");
        setSessions(res.data);
      } catch (e) {
        console.error("Failed to load sessions", e);
      } finally {
        setSessionsLoading(false);
      }
    };
    loadSessions();
  }, []);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get<{ data: any }>("/users/me/account");
        const data = res.data;
        if (data?.settings) {
          setUserSettings(data.settings);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  // Profile submit
  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileError(null);
    setProfileSaved(false);
    try {
      await api.put("/users/me", {
        full_name: data.full_name,
        username: data.username || undefined,
      });
      await useAuthStore.getState().fetchMe();
      setProfileSaved(true);
      profileForm.reset(data);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.detail : "Saqlashda xatolik");
    }
  };

  // Password submit
  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await api.post("/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.detail : "Parolni o'zgartirishda xatolik");
    }
  };

  // Phone request
  const onPhoneRequest = async (data: PhoneForm) => {
    setPhoneError(null);
    try {
      await api.post("/users/me/phone/request", { phone: data.phone });
      setPhoneStep("verify");
      verifyPhoneForm.setValue("phone", data.phone);
      startResendCooldown();
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.detail : "SMS yuborishda xatolik");
    }
  };

  // Phone verify
  const onPhoneVerify = async (data: VerifyPhoneForm) => {
    setPhoneError(null);
    try {
      await api.post("/users/me/phone/verify", { phone: data.phone, code: data.code });
      setPhoneSuccess(true);
      setPhoneStep("request");
      phoneForm.reset();
      verifyPhoneForm.reset();
      await useAuthStore.getState().fetchMe();
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.detail : "Kod noto'g'ri yoki muddati o'tgan");
    }
  };

  const startResendCooldown = () => {
    setPhoneResendCooldown(60);
    const timer = setInterval(() => {
      setPhoneResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendPhone = async () => {
    if (phoneResendCooldown > 0) return;
    const phone = phoneForm.getValues("phone");
    if (!phone) return;
    try {
      await api.post("/users/me/phone/request", { phone });
      startResendCooldown();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Qayta yuborishda xatolik");
    }
  };

  // Revoke session
  const handleRevokeSession = async (sessionId: string) => {
    const confirmed = await showConfirm({
      title: "Sessiyani tugatish",
      description: "Ushbu sessiyani tugatishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Tugatish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    setRevokingSession(sessionId);
    try {
      await api.delete(`/users/me/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Sessiyani tugatishda xatolik");
    } finally {
      setRevokingSession(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOthers = async () => {
    const confirmed = await showConfirm({
      title: "Boshqa sessiyalarni tugatish",
      description: "Boshqa barcha qurilmalardan chiqishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Tugatish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    try {
      const currentSessionId = sessions.find(s => s.is_current)?.id;
      if (!currentSessionId) return;
      await api.delete("/users/me/sessions", { current_session_id: currentSessionId });
      // Reload sessions
      const res = await api.get<{ data: any[] }>("/users/me/sessions");
      setSessions(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Sessiyalarni tugatishda xatolik");
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await api.patch("/users/me/settings", userSettings);
      toast.success("Sozlamalar saqlandi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Saqlashda xatolik");
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
          Sozlamalar
        </h1>
        <p className="text-[var(--color-slate)] mt-2">
          Profil, xavfsizlik va bildirishnoma sozlamalarini boshqaring
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto sm:h-11">
          <TabsTrigger value="profile" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <User size={16} className="shrink-0" />
            <span className="truncate min-w-0">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <ShieldCheck size={16} className="shrink-0" />
            <span className="truncate min-w-0">Xavfsizlik</span>
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Phone size={16} className="shrink-0" />
            <span className="truncate min-w-0">Telefon</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Settings size={16} className="shrink-0" />
            <span className="truncate min-w-0">Sessiyalar</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 sm:gap-2 py-2 sm:py-1.5">
            <Bell size={16} className="shrink-0" />
            <span className="truncate min-w-0">Bildirishnomalar</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-volt)]/15 flex items-center justify-center">
                  <User size={18} className="text-[var(--color-deep)]" />
                </div>
                Profil ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                {profileError && (
                  <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
                    {profileError}
                  </div>
                )}
                {profileSaved && (
                  <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-volt)]/10 text-[var(--color-deep)] text-sm font-medium">
                    Profil muvaffaqiyatli yangilandi!
                  </div>
                )}

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    To&apos;liq ism
                  </Label>
                  <Input {...profileForm.register("full_name")} type="text" />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Username
                  </Label>
                  <Input {...profileForm.register("username")} type="text" placeholder="username" />
                  <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                    Faqat harflar, raqamlar va pastki chiziq. 3-30 belgi.
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-[var(--color-mist)] text-[var(--color-slate-light)] cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                    Email o&apos;zgartirish uchun yangi emailni tasdiqlash kerak (kelajakda qo&apos;shiladi).
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Telefon
                  </Label>
                  <Input
                    type="tel"
                    value={user?.phone || "—"}
                    disabled
                    className="bg-[var(--color-mist)] text-[var(--color-slate-light)] cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                    Telefon raqamni o&apos;zgartirish uchun <TabsTrigger value="phone">Telefon</TabsTrigger> bo&apos;limiga o&apos;ting.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty}
                  >
                    {profileForm.formState.isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Saqlash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Teacher Role Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <GraduationCap size={18} className="text-[var(--color-deep)]" />
                </div>
                O&apos;qituvchi roli
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.is_teacher || user?.roles?.includes("TEACHER") ? (
                <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-emerald-50 border border-emerald-200">
                  <CheckCircle size={24} className="text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-800">Siz o&apos;qituvchi rolidasiz</p>
                    <p className="text-sm text-emerald-600">Imtihon yaratish va boshqarish imkoniyatiga egasiz</p>
                    {user?.teacher_verified_at && (
                      <p className="text-xs text-emerald-500 mt-1">
                        {new Date(user.teacher_verified_at).toLocaleDateString("uz-UZ")} dan beri
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-volt)]/5 border border-[var(--color-volt)]/20">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">O&apos;qituvchi bo&apos;ling</p>
                    <p className="text-sm text-[var(--color-slate)]">
                      Teacher Package sotib oling va imtihon yaratish imkoniyatiga ega bo&apos;ling
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleBecomeTeacher}
                    className="w-full sm:w-auto"
                  >
                    <Briefcase size={16} className="mr-2" />
                    Teacher Package
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <Award size={18} className="text-[var(--color-deep)]" />
                </div>
                Hisob ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Holat</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {user?.is_active ? "Faol" : "Nofaol"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Email tasdiqlangan</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {user?.email ? "Ha" : "Yo'q"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Telefon tasdiqlangan</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {user?.phone_verified ? "Ha" : "Yo'q"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Ro&apos;yxatdan o&apos;tgan sana</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {user?.meta && typeof user.meta === 'object' && 'created_at' in user.meta 
                    ? formatDateTime((user.meta as any).created_at) 
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Rollar</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {user?.roles?.join(", ") || "user"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-slate)]">Referral kodi</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-mist)] border border-[var(--color-line)] text-[var(--color-deep)]">
                  {user?.referral_code || "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[var(--color-deep)]" />
                </div>
                Parolni o&apos;zgartirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                {passwordError && (
                  <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-volt)]/10 text-[var(--color-deep)] text-sm font-medium">
                    Parol muvaffaqiyatli o&apos;zgartirildi!
                  </div>
                )}

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Joriy parol
                  </Label>
                  <Input {...passwordForm.register("current_password")} type="password" autoComplete="current-password" />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                    Yangi parol
                  </Label>
                  <Input {...passwordForm.register("new_password")} type="password" autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                    Kamida 8 ta belgi bo&apos;lishi kerak
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} className="mr-2" />}
                    Parolni o&apos;zgartirish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[var(--color-deep)]" />
                </div>
                Ulangan hisoblar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--color-slate)] -mt-1">
                Google yoki Telegram hisobingizni ulab, ulardan tezroq kirish uchun foydalaning.
              </p>

              {/* Google */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
                <div className="flex items-center gap-3 min-w-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--color-ink)]">Google</p>
                    <p className="text-xs text-[var(--color-slate-light)] truncate">
                      {user?.is_google_verified ? "Ulangan" : "Ulanmagan"}
                    </p>
                  </div>
                </div>
                {user?.is_google_verified ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={unlinkingGoogle}
                    onClick={handleUnlinkGoogle}
                    className="text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger-light)] shrink-0"
                  >
                    {unlinkingGoogle && <Loader2 size={14} className="animate-spin" />}
                    Uzish
                  </Button>
                ) : (
                  <div className="shrink-0 w-40">
                    {/* <GoogleLinkButton
                      onSuccess={() => toast.success("Google hisobi ulandi")}
                      onError={(msg) => toast.error(msg)}
                    /> */}
                  </div>
                )}
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
                <div className="flex items-center gap-3 min-w-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.48.7-.96.44l-2.64-1.95-1.28 1.23c-.14.14-.26.26-.54.26l.19-2.7 4.93-4.46c.21-.19-.05-.29-.33-.1L7.9 14.4l-2.59-.81c-.56-.18-.57-.56.12-.83l10.12-3.9c.47-.17.88.11.73.83l-.64-.89z"
                      fill="#26A5E4"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--color-ink)]">Telegram</p>
                    <p className="text-xs text-[var(--color-slate-light)] truncate">
                      {user?.is_telegram_verified ? "Ulangan" : "Ulanmagan"}
                    </p>
                  </div>
                </div>
                {user?.is_telegram_verified ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={unlinkingTelegram}
                    onClick={handleUnlinkTelegram}
                    className="text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger-light)] shrink-0"
                  >
                    {unlinkingTelegram && <Loader2 size={14} className="animate-spin" />}
                    Uzish
                  </Button>
                ) : (
                  <div className="shrink-0 w-40">
                    {/* <TelegramLinkButton
                      onSuccess={() => toast.success("Telegram hisobi ulandi")}
                      onError={(msg) => toast.error(msg)}
                    /> */}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut size={18} className="text-red-600" />
                </div>
                Hisobni o&apos;chirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-slate)] mb-4">
                Bu amalni bekor qilib bo&apos;lmaydi. Barcha ma&apos;lumotlaringiz doimiy o&apos;chiriladi.
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Bu funksiya hozircha ishlab chiqilmoqda"
                className="text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger-light)] disabled:opacity-50"
              >
                Hisobni o&apos;chirish
              </Button>
              <p className="text-xs text-[var(--color-slate-light)] mt-2">
                Tez orada — hozircha hisobni o&apos;chirish uchun qo&apos;llab-quvvatlash xizmatiga murojaat qiling.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Tab */}
        <TabsContent value="phone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <Phone size={18} className="text-[var(--color-deep)]" />
                </div>
                Telefon raqam
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phoneStep === "request" ? (
                <div className="space-y-4">
                  {phoneError && (
                    <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
                      {phoneError}
                    </div>
                  )}
                  {phoneSuccess && (
                    <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-volt)]/10 text-[var(--color-deep)] text-sm font-medium">
                      Telefon raqam muvaffaqiyatli o&apos;zgartirildi!
                    </div>
                  )}
                  <p className="text-sm text-[var(--color-slate)]">
                    Yangi telefon raqamingizni kiriting. Tasdiqlash kodi SMS orqali yuboriladi.
                  </p>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneRequest)} className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                        Telefon raqam
                      </Label>
                      <Input
                        {...phoneForm.register("phone")}
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        autoComplete="tel"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={phoneForm.formState.isSubmitting}
                    >
                      {phoneForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Kod yuborish"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  {phoneError && (
                    <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
                      {phoneError}
                    </div>
                  )}
                  <p className="text-sm text-[var(--color-slate)]">
                    <span className="font-medium text-[var(--color-ink)]">{phoneForm.getValues("phone")}</span> raqamiga yuborilgan 6 xonali kodni kiriting.
                  </p>
                  <form onSubmit={verifyPhoneForm.handleSubmit(onPhoneVerify)} className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                        Tasdiqlash kodi
                      </Label>
                      <Input
                        {...verifyPhoneForm.register("code")}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        className="text-center text-2xl tracking-widest"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={verifyPhoneForm.formState.isSubmitting}
                        className="flex-1"
                      >
                        {verifyPhoneForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Tasdiqlash"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setPhoneStep("request"); phoneForm.reset(); verifyPhoneForm.reset(); setPhoneError(null); }}
                      >
                        Boshqa raqam
                      </Button>
                    </div>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendPhone}
                        disabled={phoneResendCooldown > 0}
                      >
                        {phoneResendCooldown > 0
                          ? `Qayta yuborish (${phoneResendCooldown}s)`
                          : "Kodni qayta yuborish"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Joriy telefon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar fallback={user?.full_name || "U"} size="lg" />
                <div>
                  <p className="font-medium text-[var(--color-ink)] text-lg">
                    {user?.phone || "Belgilanmagan"}
                  </p>
                  <p className="text-sm text-[var(--color-slate)]">
                    {user?.phone_verified ? "Tasdiqlangan ✓" : "Tasdiqlanmagan"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center shrink-0">
                    <Settings size={18} className="text-[var(--color-deep)]" />
                  </div>
                  <span className="truncate min-w-0">Faol sessiyalar</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRevokeAllOthers} disabled={sessionsLoading} className="shrink-0">
                  Boshqalarni tugatish
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-[var(--color-slate)] py-8">Faol sessiya topilmadi</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius-lg)] border ${
                        session.is_current ? "bg-[var(--color-volt)]/5 border-[var(--color-deep)]/30" : "bg-white border-[var(--color-line)]"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                          <User size={18} className="text-[var(--color-slate)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--color-ink)] break-words">
                            {parseUserAgent(session.user_agent || "").browser} on {parseUserAgent(session.user_agent || "").os}
                            {session.is_current && <Badge variant="success" className="ml-2 text-xs">Joriy</Badge>}
                          </p>
                          <p className="text-sm text-[var(--color-slate)] break-words">
                            IP: {session.ip_address || "Noma'lum"} • {formatDateTime(session.created_at)}
                          </p>
                          {session.last_used_at && (
                            <p className="text-xs text-[var(--color-slate-light)] break-words">
                              Oxirgi faollik: {formatDateTime(session.last_used_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] shrink-0"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSession === session.id}
                        >
                          {revokingSession === session.id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                  <Bell size={18} className="text-[var(--color-deep)]" />
                </div>
                Bildirishnoma sozlamalari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brauzer bildirishnomasi uchun alohida ruxsat — quyidagi
                  kanal sozlamalaridan mustaqil, chunki bu server sozlamasi
                  emas, balki shu brauzerning o'zi bergan Notification API
                  ruxsati. */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--color-ink)] uppercase tracking-wider">
                  Brauzer bildirishnomasi
                </h3>
                {!browserNotifSupported ? (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)]">
                    <ShieldAlert size={18} className="text-[var(--color-slate)] shrink-0" />
                    <p className="text-xs text-[var(--color-slate)]">
                      Ushbu brauzer bildirishnomalarni qo&apos;llab-quvvatlamaydi.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                        {browserNotifGranted ? (
                          <BellRing size={16} className="text-[var(--color-success,#16a34a)]" />
                        ) : (
                          <BellOff size={16} className="text-[var(--color-slate)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-ink)]">
                          {browserNotifGranted
                            ? "Ruxsat berilgan"
                            : browserNotifDenied
                              ? "Ruxsat rad etilgan"
                              : "Ruxsat so'ralmagan"}
                        </p>
                        <p className="text-xs text-[var(--color-slate-light)]">
                          {browserNotifGranted
                            ? "Bu qurilma/brauzerda bildirishnomalar ko'rsatiladi."
                            : browserNotifDenied
                              ? "Brauzer sozlamalaridan qayta yoqishingiz kerak bo'ladi."
                              : "Muhim yangilanishlarni o'tkazib yubormaslik uchun ruxsat bering."}
                        </p>
                      </div>
                    </div>
                    {!browserNotifGranted && !browserNotifDenied && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={browserNotifRequesting}
                        onClick={() => requestBrowserNotifPermission()}
                        className="shrink-0"
                      >
                        {browserNotifRequesting && <Loader2 size={14} className="animate-spin" />}
                        Ruxsat berish
                      </Button>
                    )}
                    {browserNotifGranted && (
                      <Badge variant="success">Yoqilgan</Badge>
                    )}
                    {browserNotifDenied && (
                      <Badge variant="danger">Bloklangan</Badge>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-ink)] uppercase tracking-wider">
                  Bildirishnoma kanallari
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "email_notifications", label: "Email bildirishnomalar", desc: "Email orqali xabarlar yuborish" },
                    { key: "sms_notifications", label: "SMS bildirishnomalar", desc: "Telefoningizga SMS yuborish" },
                    { key: "push_notifications", label: "Push bildirishnomalar", desc: "Brauzer va mobil ilova orqali" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                          {key === "email_notifications" && <Mail size={16} className="text-[var(--color-slate)]" />}
                          {key === "sms_notifications" && <Phone size={16} className="text-[var(--color-slate)]" />}
                          {key === "push_notifications" && <Bell size={16} className="text-[var(--color-slate)]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[var(--color-ink)] truncate">{label}</p>
                          <p className="text-xs text-[var(--color-slate-light)] truncate">{desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings[key as keyof typeof userSettings] as boolean}
                        onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-ink)] uppercase tracking-wider">
                  Marketing va yangiliklar
                </h3>
                <div className="p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                        <Globe size={16} className="text-[var(--color-slate)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-ink)]">Marketing xabarnomasi</p>
                        <p className="text-xs text-[var(--color-slate-light)]">Yangiliklar, takliflar va aksiyalar haqida xabar olish</p>
                      </div>
                    </div>
                    <Switch
                      checked={userSettings.marketing_consent}
                      onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, marketing_consent: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-ink)] uppercase tracking-wider">
                  Til va vaqt mintaqasi
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Til</Label>
                    <Select
                      value={userSettings.language}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="uz">O&apos;zbekcha</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">Vaqt mintaqasi</Label>
                    <Select
                      value={userSettings.timezone}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                      <option value="Asia/Tashkent">Toshkent (UTC+5)</option>
                      <option value="Asia/Samarkand">Samarqand (UTC+5)</option>
                      <option value="Europe/Moscow">Moskva (UTC+3)</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-line)]">
                <Button onClick={handleSaveSettings} disabled={settingsSaving} variant="primary" size="lg">
                  {settingsSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-2" />}
                  Barcha sozlamalarni saqlash
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <SettingsPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}