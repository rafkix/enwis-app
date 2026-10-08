"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Check,
  RotateCcw,
  CreditCard,
  Copy,
  CopyCheck,
  Upload,
  FileText,
  X,
  Clock,
  ShieldCheck,
  XCircle,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Modal,
  ModalOverlay,
  ModalPanel,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { subscriptionService } from "@/services/subscription.service";
import { billingService } from "@/services/billing.service";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { SubscriptionPlan, Subscription, Payment, PaymentStatus, BillingPricingPlan, TeacherPackage, PaymentCard } from "@/lib/types";

type LoadState = "loading" | "error" | "success";

const MAX_RECEIPT_MB = 5;
const ACCEPTED_RECEIPT_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString("uz-UZ")} ${currency}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "To'lov kutilmoqda",
  waiting_for_review: "Tekshirilmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
  expired: "Muddati o'tgan",
  cancelled: "Bekor qilingan",
};

const STATUS_VARIANT: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  pending: "warning",
  waiting_for_review: "info",
  approved: "success",
  rejected: "danger",
  expired: "default",
  cancelled: "default",
};

function formatCardNumber(digits: string) {
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

// ── Checkout modal: shows the card to pay to, then lets the user upload
// the transfer receipt. Reused both for a brand-new payment (just
// initiated) and for resuming an existing PENDING payment from history.
function CheckoutModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = payment.card;

  const handleCopy = () => {
    if (!card) return;
    navigator.clipboard.writeText(card.card_number);
    setCopied(true);
    toast.success("Karta raqami nusxalandi");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_RECEIPT_MB * 1024 * 1024) {
      toast.error(`Fayl hajmi ${MAX_RECEIPT_MB}MB dan oshmasligi kerak`);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await billingService.uploadReceipt(payment.id, file, setProgress);
      toast.success("Chek yuborildi, tez orada tekshiriladi");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Chekni yuklashda xatolik yuz berdi",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay>
        <ModalPanel size="sm">
          <ModalHeader>To'lovni amalga oshirish</ModalHeader>
          <ModalBody className="space-y-5">
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-mist)] p-4">
              <p className="text-sm text-[var(--color-slate)]">Reja</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-medium text-[var(--color-ink)]">{payment.plan_name}</p>
                <p className="font-semibold text-[var(--color-ink)]">
                  {formatPrice(payment.amount, payment.currency)}
                </p>
              </div>
            </div>

            {card ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-4 space-y-2">
                <p className="text-sm text-[var(--color-slate)]">
                  Ushbu kartaga o'tkazma qiling:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-lg tracking-wide text-[var(--color-ink)]">
                    {formatCardNumber(card.card_number)}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <CopyCheck size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="text-sm text-[var(--color-ink)]">{card.card_holder_name}</p>
                {card.bank_name && (
                  <p className="text-xs text-[var(--color-slate-light)]">{card.bank_name}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-danger)]">
                Hozircha faol karta topilmadi. Iltimos keyinroq urinib ko'ring.
              </p>
            )}

            <div>
              <p className="text-sm text-[var(--color-slate)] mb-2">
                O'tkazma chekini (skrinshot) yuklang:
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_RECEIPT_TYPES}
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
              {!file ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] py-6 text-sm text-[var(--color-slate)] hover:border-[var(--color-deep)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  Fayl tanlash (JPEG, PNG, WEBP yoki PDF, {MAX_RECEIPT_MB}MB gacha)
                </button>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[var(--color-deep)] shrink-0" />
                      <span className="text-sm text-[var(--color-ink)] truncate">
                        {file.name}
                      </span>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-[var(--color-slate)] hover:text-[var(--color-danger)] shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {uploading && (
                    <div className="space-y-1">
                      <Progress value={progress} />
                      <p className="text-xs text-[var(--color-slate-light)]">
                        Yuklanmoqda... {progress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} disabled={uploading}>
              Yopish
            </Button>
            <Button onClick={handleUpload} disabled={!file || !card || uploading}>
              {uploading ? "Yuklanmoqda..." : "Chekni yuborish"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </ModalOverlay>
    </Modal>
  );
}

// ── Teacher package checkout: same pay-then-upload-receipt flow as
// CheckoutModal above, but for the one-time Teacher package purchase.
// A separate component because the purchase response shape isn't fully
// documented (openapi has an empty schema for it) — so we normalize the
// purchase id/amount/currency on the call site and always fetch the
// receiving card list from the reliable GET /payments/cards endpoint
// instead of trusting whatever the purchase response happened to include.
interface TeacherCheckoutState {
  purchaseId: string;
  packageName: string;
  amount: number;
  currency: string;
  cards: PaymentCard[];
}

function TeacherCheckoutModal({
  info,
  onClose,
  onDone,
}: {
  info: TeacherCheckoutState;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = info.cards[0] ?? null;

  const handleCopy = () => {
    if (!card) return;
    navigator.clipboard.writeText(card.card_number);
    setCopied(true);
    toast.success("Karta raqami nusxalandi");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_RECEIPT_MB * 1024 * 1024) {
      toast.error(`Fayl hajmi ${MAX_RECEIPT_MB}MB dan oshmasligi kerak`);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await billingService.uploadTeacherPurchaseReceipt(info.purchaseId, file);
      toast.success("Chek yuborildi, admin tasdiqlashini kuting");
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "Chekni yuklashda xatolik yuz berdi",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm({
      title: "Xaridni bekor qilish",
      description: "Teacher paketi xaridini bekor qilishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Bekor qilish",
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      await billingService.cancelTeacherPurchase(info.purchaseId);
      toast.success("Xarid bekor qilindi");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Bekor qilishda xatolik");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay>
        <ModalPanel size="sm">
          <ModalHeader>Teacher paketini sotib olish</ModalHeader>
          <ModalBody className="space-y-5">
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-mist)] p-4">
              <p className="text-sm text-[var(--color-slate)]">Paket</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-medium text-[var(--color-ink)]">{info.packageName}</p>
                <p className="font-semibold text-[var(--color-ink)]">
                  {formatPrice(info.amount, info.currency)}
                </p>
              </div>
            </div>

            {card ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-4 space-y-2">
                <p className="text-sm text-[var(--color-slate)]">
                  Ushbu kartaga o&apos;tkazma qiling:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-lg tracking-wide text-[var(--color-ink)]">
                    {formatCardNumber(card.card_number)}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <CopyCheck size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="text-sm text-[var(--color-ink)]">{card.card_holder_name}</p>
                {card.bank_name && (
                  <p className="text-xs text-[var(--color-slate-light)]">{card.bank_name}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-danger)]">
                Hozircha faol karta topilmadi. Iltimos keyinroq urinib ko&apos;ring.
              </p>
            )}

            <div>
              <p className="text-sm text-[var(--color-slate)] mb-2">
                O&apos;tkazma chekini (skrinshot) yuklang:
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_RECEIPT_TYPES}
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
              {!file ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] py-6 text-sm text-[var(--color-slate)] hover:border-[var(--color-deep)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  Fayl tanlash (JPEG, PNG, WEBP yoki PDF, {MAX_RECEIPT_MB}MB gacha)
                </button>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[var(--color-deep)] shrink-0" />
                      <span className="text-sm text-[var(--color-ink)] truncate">
                        {file.name}
                      </span>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-[var(--color-slate)] hover:text-[var(--color-danger)] shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--color-slate-light)]">
              Chek yuklangach xarid &quot;ko&apos;rib chiqilmoqda&quot; holatiga o&apos;tadi.
              TEACHER roli darhol emas — faqat admin tasdiqlagach beriladi.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCancel} disabled={uploading || cancelling}>
              {cancelling ? "Bekor qilinmoqda..." : "Xaridni bekor qilish"}
            </Button>
            <Button onClick={handleUpload} disabled={!file || !card || uploading}>
              {uploading ? "Yuklanmoqda..." : "Chekni yuborish"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </ModalOverlay>
    </Modal>
  );
}

function BillingPageContent() {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const user = useAuthStore((s) => s.user);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<Payment | null>(null);

  // Teacher package
  const [teacherPkg, setTeacherPkg] = useState<TeacherPackage | null>(null);
  const [purchasingTeacher, setPurchasingTeacher] = useState(false);
  const [teacherCheckout, setTeacherCheckout] = useState<TeacherCheckoutState | null>(null);

  // Billing pricing plans (Standard / Pro / Premium)
  const [billingPlans, setBillingPlans] = useState<BillingPricingPlan[]>([]);

  const load = useCallback(async () => {
    setState("loading");
    setErrorMsg(null);
    try {
      const [plansRes, meRes, historyRes, billingPlansRes] = await Promise.all([
        subscriptionService.plans(true),
        subscriptionService.me(),
        billingService.listPayments(1, 20),
        billingService.getPricingPlans().catch(() => ({ items: [], total: 0 })),
      ]);
      setPlans(plansRes.items);
      setCurrent(meRes.active ? (meRes as unknown as Subscription) : null);
      setHistory(historyRes.items);
      // FIX: getPricingPlans now returns { items, total } — not { data: [] }
      setBillingPlans(billingPlansRes.items ?? []);
      setState("success");

      // Load teacher package info
      // FIX: getTeacherPackage returns ApiResponse<TeacherPackage>, so .data is the package
      billingService.getTeacherPackage().then(res => setTeacherPkg(res.data)).catch(() => {});
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof ApiError ? err.detail : "Yuklashda xatolik yuz berdi");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setInitiating(plan.id);
    try {
      if (plan.price === 0) {
        await subscriptionService.subscribeFree(plan.id);
        toast.success("Tarifga muvaffaqiyatli obuna bo'ldingiz");
        await load();
        return;
      }
      const checkout = await billingService.initiate({ plan_id: plan.id });
      setCheckoutPayment(checkout.payment.card ? checkout.payment : {
        ...checkout.payment,
        card: checkout.cards[0] ?? null,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Obuna bo'lishda xatolik");
    } finally {
      setInitiating(null);
    }
  };

  const handleResumePayment = (payment: Payment) => {
    setCheckoutPayment(payment);
  };

  // Normalizes the teacher-package purchase response, whose exact shape
  // isn't guaranteed by openapi (empty schema) — tries the most likely
  // nesting patterns used elsewhere in this backend (raw object, or
  // wrapped in { data: ... }, optionally with a nested `purchase` key).
  const normalizeTeacherPurchase = (raw: unknown): { id: string; amount: number; currency: string; status: string } | null => {
    const obj = raw as Record<string, unknown>;
    const candidates: unknown[] = [
      obj,
      obj?.data,
      (obj?.data as Record<string, unknown>)?.purchase,
      obj?.purchase,
    ];
    for (const c of candidates) {
      const rec = c as Record<string, unknown> | undefined;
      if (rec && typeof rec.id === "string" && typeof rec.amount === "number") {
        return {
          id: rec.id,
          amount: rec.amount,
          currency: (rec.currency as string) || "UZS",
          status: (rec.status as string) || "pending",
        };
      }
    }
    return null;
  };

  const handlePurchaseTeacher = async () => {
    if (!teacherPkg) return;
    setPurchasingTeacher(true);
    try {
      const [purchaseRes, cardsRes] = await Promise.all([
        billingService.purchaseTeacherPackage(),
        billingService.listCards().catch(() => ({ items: [], total: 0 })),
      ]);
      const purchase = normalizeTeacherPurchase(purchaseRes);
      if (!purchase) {
        toast.error("Xarid yaratildi, lekin javobni o'qib bo'lmadi. Iltimos qo'llab-quvvatlash xizmatiga murojaat qiling.");
        return;
      }
      // Oldin to'langan (completed) xarid aniqlansa, backend TEACHER rolni
      // tikladi — chek yuklash oynasini ochmay, muvaffaqiyat ko'rsatamiz.
      if (purchase.status === "completed") {
        toast.success("O'qituvchi roli muvaffaqiyatli tiklandi");
        await load();
        return;
      }
      setTeacherCheckout({
        purchaseId: purchase.id,
        packageName: teacherPkg.name,
        amount: purchase.amount,
        currency: purchase.currency,
        cards: cardsRes.items.filter((c) => c.is_active),
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xarid boshlashda xatolik yuz berdi");
    } finally {
      setPurchasingTeacher(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!current) return;
    const confirmed = await showConfirm({
      title: "Obunani bekor qilish",
      description: "Joriy obunangizni bekor qilishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Bekor qilish",
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    setCancellingSub(true);
    try {
      await subscriptionService.cancel(current.id);
      toast.success("Obuna bekor qilindi");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Bekor qilishda xatolik");
    } finally {
      setCancellingSub(false);
    }
  };

  const handleCancelPayment = async (payment: Payment) => {
    const confirmed = await showConfirm({
      title: "To'lovni bekor qilish",
      description: "Ushbu to'lovni bekor qilishni xohlaysizmi?",
      variant: "warning",
      confirmText: "Bekor qilish",
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    setCancellingPaymentId(payment.id);
    try {
      await billingService.cancelPayment(payment.id);
      toast.success("To'lov bekor qilindi");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Bekor qilishda xatolik");
    } finally {
      setCancellingPaymentId(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-2/3 mb-3" />
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--color-danger)] mb-4">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw size={14} />
            Qayta urinish
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Obuna / Tarif</h1>
        <p className="text-sm text-[var(--color-slate)] mt-1">
          Joriy tarifingiz va mavjud rejalar.
        </p>
      </div>

      {/* Current status */}
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-volt)]/15">
              <CreditCard size={18} className="text-[var(--color-deep)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-slate)]">Joriy tarif</p>
              <p className="font-medium text-[var(--color-ink)]">
                {current?.plan_name ?? "Bepul (obunasiz)"}
              </p>
            </div>
          </div>
          {current && current.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancellingSub}
              onClick={handleCancelSubscription}
            >
              Obunani bekor qilish
            </Button>
          )}
        </div>
      </Card>

      {/* Teacher Package */}
      {teacherPkg && (
        <Card className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-volt)]/15">
                <GraduationCap size={22} className="text-[var(--color-deep)]" />
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--color-ink)]">{teacherPkg.name}</p>
                <p className="text-sm text-[var(--color-slate)]">{teacherPkg.description}</p>
                {user?.is_teacher ? (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Siz o'qituvchisiz</span>
                  </div>
                ) : (
                  <p className="text-xl font-semibold text-[var(--color-ink)] mt-2">
                    {formatPrice(teacherPkg.price, teacherPkg.currency)}
                    <span className="text-sm font-normal text-[var(--color-slate)] ml-1">
                      bir marta
                    </span>
                  </p>
                )}
              </div>
            </div>
            {!user?.is_teacher && (
              <Button
                variant="primary"
                size="md"
                disabled={purchasingTeacher}
                onClick={handlePurchaseTeacher}
              >
                {purchasingTeacher ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Briefcase size={16} className="mr-2" />
                )}
                {purchasingTeacher ? "Yuklanmoqda..." : "Sotib olish"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Billing Pricing Plans (Standard / Pro / Premium) */}
      {billingPlans.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-[var(--color-ink)] mb-4">
            Billing rejalari
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {billingPlans.map((plan) => {
              // FIX: backend returns `discount` (not `_active_discount`) and a
              // pre-computed `discounted_price`. Use backend value when available.
              const hasDiscount = plan.discount;
              const discountedPrice = plan.discounted_price ?? plan.price;
              return (
                <Card key={plan.id} className="p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[var(--color-ink)]">{plan.display_name || plan.name}</h3>
                    {plan.is_default && <Badge variant="success">Bepul</Badge>}
                  </div>
                  <div className="mb-1">
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold text-[var(--color-ink)]">
                          {formatPrice(discountedPrice, plan.currency)}
                        </span>
                        <span className="text-sm line-through text-[var(--color-slate-light)]">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <Badge variant="warning">-{hasDiscount.percentage}%</Badge>
                      </div>
                    ) : (
                      <p className="text-2xl font-semibold text-[var(--color-ink)]">
                        {formatPrice(plan.price, plan.currency)}
                      </p>
                    )}
                    <span className="text-sm font-normal text-[var(--color-slate)]">
                      / {plan.interval}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-[var(--color-slate)] mb-4">{plan.description}</p>
                  )}
                  <ul className="space-y-1.5 text-sm text-[var(--color-slate)] mb-5 flex-1">
                    {plan.features?.map((f) => (
                      <li key={f.id} className="flex items-center gap-2">
                        <Check size={14} className="text-[var(--color-deep)]" />
                        {f.feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-medium text-[var(--color-ink)] mb-4">Rejalar</h2>
        {plans.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[var(--color-slate)]">
            Hozircha mavjud tariflar yo&apos;q
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = current?.plan_id === plan.id && current.status === "active";
              return (
                <Card
                  key={plan.id}
                  className={`p-6 flex flex-col ${isCurrent ? "ring-2 ring-[var(--color-deep)]" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[var(--color-ink)]">{plan.display_name}</h3>
                    {isCurrent && <Badge variant="success">Joriy</Badge>}
                  </div>
                  <p className="text-2xl font-semibold text-[var(--color-ink)] mb-1">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-sm font-normal text-[var(--color-slate)]">
                      {" "}
                      / {plan.interval}
                    </span>
                  </p>
                  {plan.description && (
                    <p className="text-sm text-[var(--color-slate)] mb-4">{plan.description}</p>
                  )}
                  <ul className="space-y-1.5 text-sm text-[var(--color-slate)] mb-5 flex-1">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[var(--color-deep)]" /> {plan.max_tests}{" "}
                      tagacha test
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[var(--color-deep)]" />{" "}
                      {plan.max_participants_per_test} tagacha ishtirokchi
                    </li>
                    {plan.ai_generation && (
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[var(--color-deep)]" /> AI orqali savol
                        yaratish
                      </li>
                    )}
                    {plan.certificate && (
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[var(--color-deep)]" /> Sertifikat
                      </li>
                    )}
                  </ul>
                  <Button
                    variant={isCurrent ? "outline" : "primary"}
                    size="sm"
                    className="w-full"
                    disabled={isCurrent || initiating === plan.id}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent
                      ? "Faol tarif"
                      : initiating === plan.id
                        ? "Yuklanmoqda..."
                        : plan.price === 0
                          ? "Faollashtirish"
                          : "Tanlash"}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-[var(--color-ink)] mb-4">To'lovlar tarixi</h2>
          <Card className="divide-y divide-[var(--color-line)]">
            {history.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-mist)] shrink-0">
                    {p.status === "approved" ? (
                      <ShieldCheck size={16} className="text-emerald-600" />
                    ) : p.status === "rejected" ? (
                      <XCircle size={16} className="text-[var(--color-danger)]" />
                    ) : (
                      <Clock size={16} className="text-[var(--color-slate)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {p.plan_name ?? p.plan_id}
                    </p>
                    <p className="text-xs text-[var(--color-slate-light)] truncate">
                      {formatDate(p.created_at)} · {formatPrice(p.amount, p.currency)}
                    </p>
                    {p.status === "rejected" && p.rejection_reason && (
                      <p className="text-xs text-[var(--color-danger)] mt-0.5">
                        Sabab: {p.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  {p.status === "pending" && !p.receipt_image && (
                    <Button variant="outline" size="sm" onClick={() => handleResumePayment(p)}>
                      Chek yuklash
                    </Button>
                  )}
                  {(p.status === "pending" || p.status === "waiting_for_review") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancellingPaymentId === p.id}
                      onClick={() => handleCancelPayment(p)}
                    >
                      Bekor qilish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {checkoutPayment && (
        <CheckoutModal
          payment={checkoutPayment}
          onClose={() => setCheckoutPayment(null)}
          onDone={() => {
            setCheckoutPayment(null);
            load();
          }}
        />
      )}

      {teacherCheckout && (
        <TeacherCheckoutModal
          info={teacherCheckout}
          onClose={() => setTeacherCheckout(null)}
          onDone={() => {
            setTeacherCheckout(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <BillingPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
