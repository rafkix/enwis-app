"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Clock,
  Trash2,
  Copy,
  Play,
  Archive,
  Save,
  Loader2,
  Sparkles,
  Share2,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { openExternalLink } from "@/lib/utils";
import { useTestStore } from "@/stores/test";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }
> = {
  draft: { label: "Qoralama", variant: "default" },
  active: { label: "Faol", variant: "success" },
  archived: { label: "Arxiv", variant: "warning" },
};

function TestDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const {
    currentTest: test,
    currentQuestions: questions,
    isLoading,
    fetchTest,
    fetchQuestions,
    updateTest,
    deleteTest,
    publishTest,
    unpublishTest,
    archiveTest,
    duplicateTest,
    shareTest,
    clearTest,
  } = useTestStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [testType, setTestType] = useState("single_choice");
  const [visibility, setVisibility] = useState("private");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [showResult, setShowResult] = useState(true);
  const [allowReview, setAllowReview] = useState(true);

  useEffect(() => {
    fetchTest(id);
    fetchQuestions(id);
    return () => clearTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (test) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(test.title);
      setDescription(test.description || "");
      setInstructions(test.instructions || "");
      setTestType(test.test_type);
      setVisibility(test.visibility);
      setShuffleQuestions(test.shuffle_questions);
      setShuffleAnswers(test.shuffle_answers);
      setNegativeMarking(test.negative_marking);
      setAutoSubmit(test.auto_submit);
      setShowResult(test.show_result);
      setAllowReview(test.allow_review);
    }
  }, [test]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Test nomini kiriting");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateTest(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        test_type: testType,
        visibility,
        shuffle_questions: shuffleQuestions,
        shuffle_answers: shuffleAnswers,
        negative_marking: negativeMarking,
        auto_submit: autoSubmit,
        show_result: showResult,
        allow_review: allowReview,
      });
      toast.success("Test saqlandi");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError("Test is published and cannot be modified. Duplicate it first.");
      } else {
        setError(e instanceof ApiError ? e.detail : "Saqlashda xatolik");
      }
    }
    setSaving(false);
  };

  const handleUnpublish = async () => {
    const confirmed = await showConfirm({
      title: "Nashrni bekor qilish",
      description: "Test qoralama holatiga qaytariladi va yana tahrirlash mumkin bo'ladi.",
      variant: "warning",
      confirmText: "Bekor qilish",
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    try {
      await unpublishTest(id);
      toast.success("Test qoralamaga qaytarildi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Amalda xatolik");
    }
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      toast.error("Nashr etishdan oldin kamida 1 ta savol qo'shing");
      return;
    }
    const confirmed = await showConfirm({
      title: "Testni nashr etish",
      description: "Testni nashr etishni xohlaysizmi?",
      variant: "info",
      confirmText: "Nashr etish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    try {
      await publishTest(id);
      toast.success("Test nashr etildi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Nashr etishda xatolik");
    }
  };

  const handleArchive = async () => {
    const confirmed = await showConfirm({
      title: "Testni arxivlash",
      description: "Testni arxivlashni xohlaysizmi?",
      variant: "warning",
      confirmText: "Arxivlash",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    try {
      await archiveTest(id);
      toast.success("Test arxivlandi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Arxivlashda xatolik");
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: "Testni o'chirish",
      description: "Bu amal qaytarib bo'lmaydi.",
      variant: "danger",
      confirmText: "O'chirish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    try {
      await deleteTest(id);
      toast.success("Test o'chirildi");
      router.push("/tests");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "O'chirishda xatolik");
    }
  };

  const handleDuplicate = async () => {
    try {
      const t = await duplicateTest(id);
      toast.success("Nusxalandi");
      router.push(`/tests/${t.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Nusxalashda xatolik");
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await shareTest(id);
      setShareUrl(result.public_url);
      setCopied(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Havola olishda xatolik");
    }
    setSharing(false);
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Nusxalab bo'lmadi — havolani qo'lda ko'chiring");
    }
  };

  if (isLoading || !test) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[test.status] || STATUS_MAP.draft;
  // Active (published) tests are read-only server-side (409 on any edit) —
  // mirror that here so the form doesn't invite edits that will just fail.
  const isLocked = test.status === "active";

  const sectionHeader = (title: string, icon: React.ReactNode, right?: React.ReactNode) => (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-[var(--color-line)]">
      <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink)]">
        <div className="w-7 h-7 rounded-full bg-[var(--color-volt)]/15 flex items-center justify-center shrink-0">
          {icon}
        </div>
        {title}
      </div>
      {right}
    </div>
  );

  const sectionStyle =
    "rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tests"
            className="rounded-full p-2 text-[var(--color-slate)] hover:bg-[var(--color-mist)] shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium truncate">{test.title}</h1>
              <Badge variant={statusInfo.variant} className="shrink-0">{statusInfo.label}</Badge>
            </div>
            <p className="text-xs text-[var(--color-slate)]">{test.questions_count} savol</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {test.status === "draft" && (
            <Button size="sm" onClick={handlePublish}>
              <Play className="h-3.5 w-3.5" />
              Nashr etish
            </Button>
          )}
          {test.status === "active" && (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              Nashrni bekor qilish
            </Button>
          )}
          {test.status === "active" && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
              Arxivlash
            </Button>
          )}
          <Link href={`/tests/${id}/preview`}>
            <Button variant="outline" size="sm">
              <Eye className="h-3.5 w-3.5" />
              Ko&apos;rib chiqish
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing}>
            {sharing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            Havola
          </Button>
          {test.status === "draft" && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-[var(--color-danger)]">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm">
          {error}
        </div>
      )}

      {isLocked && (
        <div className="mb-4 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)] text-[var(--color-slate)] text-sm">
          Test nashr etilgan va tahrirlab bo&apos;lmaydi. Tahrirlash uchun nusxa oling yoki nashrni bekor qiling.
        </div>
      )}

      {shareUrl && (
        <div className="mb-4 p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)] flex items-center gap-3">
          <Share2 size={16} className="text-[var(--color-deep)] shrink-0" />
          <button
            type="button"
            onClick={() => openExternalLink(shareUrl)}
            className="text-sm text-[var(--color-deep)] underline truncate flex-1 text-left"
          >
            {shareUrl}
          </button>
          <Button variant="outline" size="sm" onClick={handleCopyShareUrl} className="shrink-0">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className={sectionStyle}>
          {sectionHeader("Umumiy ma'lumot", <FileText size={15} className="text-[var(--color-deep)]" />)}
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs font-medium mb-1 block">Nomi</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLocked} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1 block">Turi</Label>
                <Select value={testType} onChange={(e) => setTestType(e.target.value)} disabled={isLocked}>
                  <option value="single_choice">Bitta javob</option>
                  <option value="multiple_choice">Ko&apos;p javob</option>
                  <option value="true_false">To&apos;g&apos;ri/Noto&apos;g&apos;ri</option>
                  <option value="short_answer">Qisqa javob</option>
                  <option value="essay">Insho</option>
                  <option value="mixed">Aralash</option>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Ko&apos;rinish</Label>
                <Select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={isLocked}>
                  <option value="private">Maxfiy</option>
                  <option value="public">Ommaviy</option>
                  <option value="organization">Tashkilot</option>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Tavsif</Label>
              <textarea
                className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-3 py-2 text-sm min-h-[60px] disabled:opacity-60 disabled:cursor-not-allowed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Ko&apos;rsatmalar</Label>
              <textarea
                className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-3 py-2 text-sm min-h-[60px] disabled:opacity-60 disabled:cursor-not-allowed"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Savollar — endi ALOHIDA SAHIFA (/tests/[id]/questions). Bu yerda
            faqat qisqa xulosa + o'sha sahifaga o'tish tugmasi. */}
        <Link href={`/tests/${id}/questions`} className="block group">
          <div className={`${sectionStyle} p-5 flex items-center justify-between gap-4 hover:border-[var(--color-deep)]/40 transition-colors`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-volt)]/15 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-[var(--color-deep)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)]">Savollar</p>
                <p className="text-xs text-[var(--color-slate)]">
                  {questions.length > 0
                    ? `${questions.length} ta savol — qo'shish, tahrirlash, AI, import/export`
                    : "Hali savol yo'q — qo'shish, AI orqali yaratish yoki import qilish"}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-[var(--color-slate-light)] group-hover:text-[var(--color-deep)] group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        <div className={sectionStyle}>
          {sectionHeader("Sozlamalar", <Clock size={15} className="text-[var(--color-deep)]" />)}
          <div className="p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                  Vaqt va urinishlar
                </h4>
                <p className="text-xs text-[var(--color-slate)] leading-relaxed">
                  Vaqt chegarasi, o&apos;tish bali va urinishlar soni — bular imtihon (Exam)
                  darajasida sozlanadi, chunki bitta test bir nechta imtihonda turlicha
                  qoidalar bilan ishlatilishi mumkin.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                  Xulq-atvor
                </h4>
                {[
                  { label: "Savollarni aralashtirish", checked: shuffleQuestions, onChange: setShuffleQuestions },
                  { label: "Javoblarni aralashtirish", checked: shuffleAnswers, onChange: setShuffleAnswers },
                  { label: "Salb baholash", checked: negativeMarking, onChange: setNegativeMarking },
                  { label: "Avtomatik topshirish", checked: autoSubmit, onChange: setAutoSubmit },
                  { label: "Natijani ko'rsatish", checked: showResult, onChange: setShowResult },
                  { label: "Tekshirishga ruxsat", checked: allowReview, onChange: setAllowReview },
                ].map(({ label, checked, onChange }) => (
                  <div key={label} className="flex items-center justify-between py-0.5">
                    <span className="text-sm">{label}</span>
                    <Switch checked={checked} onCheckedChange={onChange} disabled={isLocked} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 py-8">
        <Button onClick={handleSave} disabled={saving || !title.trim() || isLocked} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Saqlash
        </Button>
      </div>
    </div>
  );
}

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  if (!id) return null;

  return (
    <DialogProvider>
      <ToastProvider>
        <TestDetailContent id={id} />
      </ToastProvider>
    </DialogProvider>
  );
}