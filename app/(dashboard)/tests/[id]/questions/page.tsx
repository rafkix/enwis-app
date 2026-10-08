"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  FileText,
  Info,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import {
  Modal,
  ModalOverlay,
  ModalPanel,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { testService } from "@/services/test.service";
import { useTestStore } from "@/stores/test";
import { QUESTION_TYPES } from "@/components/tests/question-form";
import type { QuestionType, TestQuestion } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label]),
);

const DIFFICULTIES: { value: "easy" | "medium" | "hard"; label: string }[] = [
  { value: "easy", label: "Oson" },
  { value: "medium", label: "O'rta" },
  { value: "hard", label: "Qiyin" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function QuestionsPageContent({ id }: { id: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const showConfirm = useConfirm();
  const {
    currentTest: test,
    currentQuestions: questions,
    isLoading,
    fetchTest,
    fetchQuestions,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    generateQuestionsAI,
    importQuestionsJson,
    importQuestionsExcel,
    importQuestionsCsv,
    exportQuestionsJson,
    exportQuestionsExcel,
    exportQuestionsCsv,
  } = useTestStore();

  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiCount, setAiCount] = useState(5);
  const [aiType, setAiType] = useState<QuestionType>("multiple_choice");
  const [aiProvider, setAiProvider] = useState<"groq" | "openrouter">("groq");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<TestQuestion[] | null>(null);

  useEffect(() => {
    fetchTest(id);
    fetchQuestions(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteQuestion = async (qId: string) => {
    const confirmed = await showConfirm({
      title: "Savolni o'chirish",
      description: "Savolni o'chirishni xohlaysizmi?",
      variant: "warning",
      confirmText: "O'chirish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    try {
      await deleteQuestion(id, qId);
      toast.success("Savol o'chirildi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "O'chirishda xatolik");
    }
  };

  const handleDuplicateQuestion = async (q: TestQuestion) => {
    setDuplicatingId(q.id);
    try {
      await duplicateQuestion(id, q);
      toast.success("Savol nusxalandi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Nusxalashda xatolik");
    }
    setDuplicatingId(null);
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const ids = questions.map((q) => q.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    setReorderingId(questions[index].id);
    try {
      await reorderQuestions(id, ids);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Tartiblashda xatolik");
    }
    setReorderingId(null);
  };

  const handleImportFile = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      if (importFile.name.endsWith(".json")) {
        await importQuestionsJson(id, importFile);
      } else if (importFile.name.endsWith(".xlsx") || importFile.name.endsWith(".xls")) {
        await importQuestionsExcel(id, importFile);
      } else {
        await importQuestionsCsv(id, importFile);
      }
      toast.success("Import qilindi");
      setShowImport(false);
      setImportFile(null);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.detail : e instanceof Error ? e.message : "Importda xatolik",
      );
    }
    setImporting(false);
  };

  const handleExport = async (format: "json" | "excel" | "csv") => {
    setExporting(format);
    try {
      if (format === "json") {
        const data = await exportQuestionsJson(id);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${test?.title || "test"}.json`);
      } else if (format === "excel") {
        const blob = await exportQuestionsExcel(id);
        downloadBlob(blob, `${test?.title || "test"}.xlsx`);
      } else {
        const blob = await exportQuestionsCsv(id);
        downloadBlob(blob, `${test?.title || "test"}.csv`);
      }
      toast.success("Eksport qilindi");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Eksportda xatolik");
    }
    setExporting(null);
  };

  const handleAiGenerate = async () => {
    if (!aiSubject.trim() || !aiTopic.trim()) return;
    // No frontend precheck of role/subscription here on purpose — the
    // frontend can't reliably know TEACHER status or whether a PRO/PREMIUM
    // subscription is still active (token may be stale, subscription can
    // expire at any moment). Always call the endpoint and react to the
    // backend's actual response (403/429) instead.
    setAiGenerating(true);
    try {
      const generated = await generateQuestionsAI(id, {
        provider: aiProvider,
        subject: aiSubject.trim(),
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        question_count: aiCount,
        question_type: aiType,
        language: "uz",
      });
      setAiPreview(generated);
      toast.success(`${generated.length} ta savol generatsiya qilindi va testga saqlandi`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error(
          e.detail || "AI question generation is not available on your current plan. Upgrade to PRO or PREMIUM.",
          {
            duration: 8000,
            action: (
              <button
                onClick={() => router.push("/billing")}
                className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
              >
                Tarifni oshirish
              </button>
            ),
          },
        );
      } else if (e instanceof ApiError && e.status === 429) {
        toast.error(e.detail || "Oylik AI limiti tugadi", { duration: 8000 });
      } else {
        toast.error(e instanceof ApiError ? e.detail : "Generatsiyada xatolik");
      }
    }
    setAiGenerating(false);
  };

  const closeAiModal = () => {
    setShowAiModal(false);
    setAiPreview(null);
    setAiSubject("");
    setAiTopic("");
    setAiProvider("groq");
  };

  const isPublished = test?.status === "active";

  if (isLoading || !test) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[400px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/tests/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {test.title}
      </Link>

      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-line)] shadow-[var(--shadow-soft-sm)] overflow-hidden">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-[var(--color-line)]">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
              Savollar
            </h1>
            <p className="text-xs text-[var(--color-slate)] mt-0.5">{questions.length} ta savol</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(!showImport)} disabled={isPublished}>
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAiModal(true)}
              disabled={isPublished}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </Button>
            {!isPublished && (
              <Link href={`/tests/${id}/questions/new`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Qo&apos;shish
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="p-5 space-y-3">
          {isPublished && (
            <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-lg)] bg-amber-50 text-amber-700 border border-amber-200 text-sm">
              <Info size={16} className="shrink-0" />
              <span>
                Test nashr etilgan — savollarni o&apos;zgartirib bo&apos;lmaydi. Tahrirlash uchun avval uni nusxalang.
              </span>
            </div>
          )}

          {showImport && (
            <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--color-slate)]">
                  Excel/CSV shabloni bo&apos;lmasa, avval namunani yuklab oling.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const blob = await testService.importTemplate.excel();
                      downloadBlob(blob, "enwis_savollar_shabloni.xlsx");
                    } catch {
                      toast.error("Shablonni yuklab olishda xatolik");
                    }
                  }}
                  className="text-xs font-medium text-[var(--color-deep)] hover:underline shrink-0"
                >
                  Namunani yuklab olish
                </button>
              </div>
              <div className="border-2 border-dashed border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 text-center">
                {importFile ? (
                  <div>
                    <p className="text-sm mb-2">{importFile.name}</p>
                    <Button variant="outline" size="sm" onClick={() => setImportFile(null)}>
                      O&apos;zgartirish
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload size={24} className="mx-auto text-[var(--color-slate-light)] mb-1" />
                    <p className="text-sm text-[var(--color-slate)]">JSON / Excel / CSV fayl tanlang</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setImportFile(f);
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImport(false);
                    setImportFile(null);
                  }}
                >
                  Bekor qilish
                </Button>
                <Button size="sm" onClick={handleImportFile} disabled={!importFile || importing}>
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Import qilish
                </Button>
              </div>
            </div>
          )}

          {showExport && (
            <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)] space-y-3">
              <p className="text-xs text-[var(--color-slate)]">
                Formatni tanlang — savollar shu formatda yuklab olinadi.
              </p>
              <div className="flex flex-wrap gap-2">
                {(["json", "excel", "csv"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(fmt)}
                    disabled={exporting !== null || questions.length === 0}
                  >
                    {exporting === fmt ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {fmt.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="text-center py-14">
              <FileText size={28} className="mx-auto mb-2 text-[var(--color-slate-light)]" />
              <p className="text-sm text-[var(--color-ink)] font-medium">Hali savol yo&apos;q</p>
              <p className="text-xs text-[var(--color-slate)] mt-0.5 mb-4">
                Yangi savol qo&apos;shing, import qiling yoki AI yordamida yarating
              </p>
              {!isPublished && (
                <Link href={`/tests/${id}/questions/new`}>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Birinchi savolni qo&apos;shish
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)] border border-[var(--color-line)] group hover:border-[var(--color-deep)]/30 transition-colors"
                >
                  <div className="flex flex-col shrink-0">
                    <button
                      onClick={() => moveQuestion(i, -1)}
                      disabled={i === 0 || isPublished || reorderingId !== null}
                      className="text-[var(--color-slate-light)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Yuqoriga siljitish"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveQuestion(i, 1)}
                      disabled={i === questions.length - 1 || isPublished || reorderingId !== null}
                      className="text-[var(--color-slate-light)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Pastga siljitish"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white text-xs font-medium flex items-center justify-center border border-[var(--color-line)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{q.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="default" className="text-[10px]">
                        {TYPE_LABELS[q.question_type] || q.question_type}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-slate-light)]">{q.score} ball</span>
                    </div>
                  </div>
                  {!isPublished && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/tests/${id}/questions/${q.id}/edit`}
                        className="text-[var(--color-slate-light)] hover:text-[var(--color-deep)] p-1"
                        aria-label="Tahrirlash"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        disabled={duplicatingId === q.id}
                        className="text-[var(--color-slate-light)] hover:text-[var(--color-ink)] p-1"
                        aria-label="Nusxalash"
                      >
                        {duplicatingId === q.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-[var(--color-slate-light)] hover:text-[var(--color-danger)] p-1"
                        aria-label="O'chirish"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAiModal} onClose={closeAiModal}>
        <ModalOverlay>
          <ModalPanel size="sm">
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                AI savol generatsiyasi
              </div>
            </ModalHeader>
            <ModalBody>
              {aiPreview ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-ink)]">
                    {aiPreview.length} ta savol yaratildi va testga saqlandi:
                  </p>
                  <div className="max-h-[320px] overflow-y-auto space-y-2">
                    {aiPreview.map((q) => (
                      <div key={q.id} className="p-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-mist)]">
                        <p className="text-sm truncate">{q.title}</p>
                        <Badge variant="default" className="text-[10px] mt-1">
                          {TYPE_LABELS[q.question_type] || q.question_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Fan / Predmet *</Label>
                    <Input placeholder="Masalan: Tarix" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Mavzu *</Label>
                    <Input
                      placeholder="Masalan: O'zbekiston tarixi"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Qiyinlik</Label>
                      <Select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as "easy" | "medium" | "hard")}
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Savollar soni</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={aiCount}
                        onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Savol turi</Label>
                    <Select value={aiType} onChange={(e) => setAiType(e.target.value as QuestionType)}>
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">AI provayder</Label>
                    <Select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as "groq" | "openrouter")}>
                      <option value="groq">Groq (tez, bepul)</option>
                      <option value="openrouter">OpenRouter (bepul)</option>
                    </Select>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {aiPreview ? (
                <Button onClick={closeAiModal}>Yopish</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={closeAiModal}>Bekor qilish</Button>
                  <Button onClick={handleAiGenerate} disabled={!aiSubject.trim() || !aiTopic.trim() || aiGenerating}>
                    {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generatsiya qilish
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalPanel>
        </ModalOverlay>
      </Modal>
    </div>
  );
}

export default function QuestionsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DialogProvider>
      <ToastProvider>
        <QuestionsPageContent id={id} />
      </ToastProvider>
    </DialogProvider>
  );
}
