"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTestStore } from "@/stores/test";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  QuestionForm,
  blankQuestionForm,
  questionFormFromQuestion,
  questionFormToPayload,
  validateQuestionForm,
} from "@/components/tests/question-form";

export default function EditQuestionPage() {
  const { id, qid } = useParams<{ id: string; qid: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const currentQuestions = useTestStore((s) => s.currentQuestions);
  const fetchQuestions = useTestStore((s) => s.fetchQuestions);
  const updateQuestion = useTestStore((s) => s.updateQuestion);

  const [form, setForm] = useState(blankQuestionForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      // Sahifa to'g'ridan-to'g'ri ochilgan bo'lishi mumkin (link orqali) —
      // shu holda currentQuestions bo'sh bo'ladi, birinchi navbatda yuklaymiz.
      if (currentQuestions.length === 0) {
        await fetchQuestions(id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const q = currentQuestions.find((x) => x.id === qid);
    if (q) {
      setForm(questionFormFromQuestion(q));
    } else if (!loading) {
      setNotFound(true);
    }
  }, [currentQuestions, qid, loading]);

  const isChoiceType =
    form.questionType === "multiple_choice" ||
    form.questionType === "multiple_select" ||
    form.questionType === "true_false";

  const handleSubmit = async () => {
    const err = validateQuestionForm(form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateQuestion(id, qid, questionFormToPayload(form, isChoiceType));
      toast.success("Savol yangilandi");
      router.push(`/tests/${id}/questions`);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Saqlashda xatolik yuz berdi");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-96 w-full rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-[var(--color-ink)] font-medium mb-2">Savol topilmadi</p>
        <p className="text-sm text-[var(--color-slate)] mb-6">
          Bu savol o&apos;chirilgan yoki mavjud emas.
        </p>
        <Link
          href={`/tests/${id}/questions`}
          className="text-sm text-[var(--color-deep)] font-medium hover:underline"
        >
          Savollar ro&apos;yxatiga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/tests/${id}/questions`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Savollar ro&apos;yxatiga qaytish
      </Link>

      <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-line)] shadow-[var(--shadow-soft-sm)] p-5 sm:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold text-[var(--color-ink)] mb-6">
          Savolni tahrirlash
        </h1>

        <QuestionForm
          form={form}
          onChange={setForm}
          error={error}
          saving={saving}
          submitLabel="Yangilash"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/tests/${id}/questions`)}
        />
      </div>
    </div>
  );
}
