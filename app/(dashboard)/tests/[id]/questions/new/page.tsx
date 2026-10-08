"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTestStore } from "@/stores/test";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  QuestionForm,
  blankQuestionForm,
  questionFormToPayload,
  validateQuestionForm,
} from "@/components/tests/question-form";

export default function NewQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const addQuestion = useTestStore((s) => s.addQuestion);

  const [form, setForm] = useState(blankQuestionForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      await addQuestion(id, questionFormToPayload(form, isChoiceType));
      toast.success("Savol qo'shildi");
      router.push(`/tests/${id}/questions`);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Saqlashda xatolik yuz berdi");
    }
    setSaving(false);
  };

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
          Savol qo&apos;shish
        </h1>

        <QuestionForm
          form={form}
          onChange={setForm}
          error={error}
          saving={saving}
          submitLabel="Qo'shish"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/tests/${id}/questions`)}
        />
      </div>
    </div>
  );
}
