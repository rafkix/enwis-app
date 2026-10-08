"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, FileText, Clock, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { testService } from "@/services/test.service";
import { resolveMediaUrl } from "@/lib/media";
import { ApiError } from "@/lib/api";
import { QUESTION_TYPES } from "@/components/tests/question-form";
import type { TestPreview } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label]),
);

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Oson",
  medium: "O'rta",
  hard: "Qiyin",
};

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }
> = {
  draft: { label: "Qoralama", variant: "default" },
  active: { label: "Faol", variant: "success" },
  completed: { label: "Yakunlangan", variant: "info" },
  archived: { label: "Arxiv", variant: "warning" },
};

function QuestionPreviewCard({ question, index }: { question: TestPreview["questions"][number]; index: number }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[var(--color-slate-light)]">#{index + 1}</span>
          <Badge variant="default">{TYPE_LABELS[question.question_type] ?? question.question_type}</Badge>
          <Badge variant="default">{DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}</Badge>
        </div>
        <span className="text-xs text-[var(--color-slate)] shrink-0">{question.score} ball</span>
      </div>

      <p className="text-[var(--color-ink)] font-medium mb-1">{question.title}</p>
      {question.description && (
        <p className="text-sm text-[var(--color-slate)] mb-3">{question.description}</p>
      )}

      {question.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveMediaUrl(question.image_url)}
          alt=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-line)] max-h-64 object-contain mb-3"
        />
      )}

      {["multiple_choice", "multiple_select", "true_false"].includes(question.question_type) && (
        <div className="space-y-2 mt-2">
          {question.choices.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border text-sm ${
                c.is_correct
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-[var(--color-line)] text-[var(--color-ink)]"
              }`}
            >
              {c.is_correct ? (
                <Check size={14} className="text-emerald-600 shrink-0" />
              ) : (
                <X size={14} className="text-[var(--color-slate-light)] shrink-0" />
              )}
              {c.content}
            </div>
          ))}
        </div>
      )}

      {["short_answer", "essay", "numeric"].includes(question.question_type) && (
        <div className="mt-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-mist)] text-sm text-[var(--color-slate)]">
          {question.correct_answer ? (
            <>
              <span className="font-medium text-[var(--color-ink)]">To&apos;g&apos;ri javob: </span>
              {question.correct_answer}
              {question.question_type === "numeric" && question.numeric_tolerance != null && (
                <span className="text-xs text-[var(--color-slate-light)]"> (± {question.numeric_tolerance})</span>
              )}
            </>
          ) : (
            "Erkin javob — avtomatik tekshirilmaydi"
          )}
        </div>
      )}

      {question.explanation && (
        <div className="mt-3 flex items-start gap-1.5 text-xs text-[var(--color-slate)]">
          <HelpCircle size={13} className="shrink-0 mt-0.5" />
          <span>{question.explanation}</span>
        </div>
      )}
    </div>
  );
}

function TestPreviewContent({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<TestPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    testService
      .preview(id)
      .then((res) => { if (!cancelled) setPreview(res); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.detail : "Testni yuklab bo'lmadi");
        router.replace(`/tests/${id}`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !preview) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-48 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-48 rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[preview.status] ?? STATUS_MAP.draft;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        href={`/tests/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Tahrirlashga qaytish
      </Link>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)] mb-6">
        {preview.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(preview.cover_image)}
            alt=""
            className="w-full h-40 object-cover rounded-[var(--radius-lg)] mb-4"
          />
        )}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            {preview.title}
          </h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        {preview.description && (
          <p className="text-sm text-[var(--color-slate)] mb-3">{preview.description}</p>
        )}
        {preview.instructions && (
          <div className="mt-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)] text-sm text-[var(--color-ink)]">
            <span className="font-medium">Ko&apos;rsatma: </span>
            {preview.instructions}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 text-xs text-[var(--color-slate)]">
          <span className="flex items-center gap-1"><FileText size={13} /> {preview.questions.length} ta savol</span>
          {preview.negative_marking && <span>Salbiy belgilash yoqilgan</span>}
          {preview.certificate_enabled && <span>Sertifikat mavjud</span>}
        </div>
      </div>

      {preview.questions.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-slate)]">
          <Clock size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Bu testda hali savollar yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {preview.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q, i) => (
              <QuestionPreviewCard key={q.id} question={q} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function TestPreviewPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ToastProvider>
      <TestPreviewContent id={id} />
    </ToastProvider>
  );
}
