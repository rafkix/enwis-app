"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  QuestionType,
  TestQuestion,
  TestQuestionChoiceInput,
  TestQuestionCreate,
} from "@/lib/types";

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  {
    value: "multiple_choice",
    label: "Bitta to'g'ri javob",
    hint: "Variantlar, faqat bittasi to'g'ri",
  },
  {
    value: "multiple_select",
    label: "Bir nechta to'g'ri javob",
    hint: "Variantlar, bir nechtasi to'g'ri bo'lishi mumkin",
  },
  {
    value: "true_false",
    label: "To'g'ri / Noto'g'ri",
    hint: "Ikkita variant: To'g'ri yoki Noto'g'ri",
  },
  {
    value: "short_answer",
    label: "Qisqa javob",
    hint: "Talaba matn kiritadi, aniq javob bilan solishtiriladi",
  },
  { value: "essay", label: "Insho", hint: "Erkin matn, qo'lda baholanadi" },
  {
    value: "numeric",
    label: "Raqamli javob",
    hint: "Talaba son kiritadi, tolerantlik bilan tekshiriladi",
  },
];

const DIFFICULTIES: { value: "easy" | "medium" | "hard"; label: string }[] = [
  { value: "easy", label: "Oson" },
  { value: "medium", label: "O'rta" },
  { value: "hard", label: "Qiyin" },
];

function emptyChoices(n: number): TestQuestionChoiceInput[] {
  return Array.from({ length: n }, (_, i) => ({
    content: "",
    is_correct: false,
    order: i,
  }));
}

function trueFalseChoices(): TestQuestionChoiceInput[] {
  return [
    { content: "To'g'ri", is_correct: true, order: 0 },
    { content: "Noto'g'ri", is_correct: false, order: 1 },
  ];
}

export interface QuestionFormState {
  questionType: QuestionType;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  score: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  correctAnswer: string;
  numericTolerance: number;
  choices: TestQuestionChoiceInput[];
}

export function blankQuestionForm(): QuestionFormState {
  return {
    questionType: "multiple_choice",
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    score: 1,
    difficulty: "medium",
    explanation: "",
    correctAnswer: "",
    numericTolerance: 0,
    choices: emptyChoices(2).map((c, i) => ({ ...c, is_correct: i === 0 })),
  };
}

export function questionFormFromQuestion(q: TestQuestion): QuestionFormState {
  return {
    questionType: q.question_type,
    title: q.title,
    description: q.description ?? "",
    imageUrl: q.image_url ?? "",
    videoUrl: q.video_url ?? "",
    score: q.score,
    difficulty: q.difficulty,
    explanation: q.explanation ?? "",
    correctAnswer: q.correct_answer ?? "",
    numericTolerance: q.numeric_tolerance ?? 0,
    choices: q.choices.length
      ? q.choices.map((c) => ({
          content: c.content,
          is_correct: c.is_correct,
          order: c.order,
        }))
      : emptyChoices(2).map((c, i) => ({ ...c, is_correct: i === 0 })),
  };
}

export function questionFormToPayload(
  form: QuestionFormState,
  isChoiceType: boolean,
): TestQuestionCreate {
  return {
    question_type: form.questionType,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    image_url: form.imageUrl.trim() || undefined,
    video_url: form.videoUrl.trim() || undefined,
    explanation: form.explanation.trim() || undefined,
    difficulty: form.difficulty,
    score: form.score,
    choices: isChoiceType
      ? form.choices.map((c, i) => ({ ...c, order: i }))
      : undefined,
    correct_answer:
      form.questionType === "short_answer" || form.questionType === "numeric"
        ? form.correctAnswer.trim()
        : undefined,
    numeric_tolerance:
      form.questionType === "numeric" ? form.numericTolerance : undefined,
  };
}

export function validateQuestionForm(form: QuestionFormState): string | null {
  const isChoiceType =
    form.questionType === "multiple_choice" ||
    form.questionType === "multiple_select" ||
    form.questionType === "true_false";
  if (!form.title.trim()) return "Savol matnini kiriting";
  if (isChoiceType) {
    if (form.choices.some((c) => !c.content.trim()))
      return "Barcha variantlarni to'ldiring";
    if (!form.choices.some((c) => c.is_correct))
      return "Kamida bitta to'g'ri javobni belgilang";
  }
  if (form.questionType === "short_answer" && !form.correctAnswer.trim())
    return "To'g'ri javob matnini kiriting";
  if (form.questionType === "numeric" && !form.correctAnswer.trim())
    return "To'g'ri son qiymatini kiriting";
  if (
    form.questionType === "numeric" &&
    Number.isNaN(Number(form.correctAnswer))
  )
    return "To'g'ri javob son bo'lishi kerak";
  return null;
}

interface QuestionFormProps {
  form: QuestionFormState;
  onChange: (form: QuestionFormState) => void;
  error: string | null;
  saving: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/** To'liq sahifali savol formasi — /tests/[id]/questions/new va
 * /tests/[id]/questions/[qid]/edit ikkalasi ham shu komponentni
 * ishlatadi (avval modal ichida edi, endi alohida sahifa). */
export function QuestionForm({
  form,
  onChange,
  error,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const isChoiceType =
    form.questionType === "multiple_choice" ||
    form.questionType === "multiple_select" ||
    form.questionType === "true_false";
  const isSingleCorrect =
    form.questionType === "multiple_choice" || form.questionType === "true_false";

  const handleTypeChange = (t: QuestionType) => {
    if (t === "true_false") {
      onChange({ ...form, questionType: t, choices: trueFalseChoices(), correctAnswer: "" });
      return;
    }
    if (t === "multiple_choice" || t === "multiple_select") {
      onChange({
        ...form,
        questionType: t,
        correctAnswer: "",
        choices:
          form.choices.length >= 2
            ? form.choices
            : emptyChoices(2).map((c, i) => ({ ...c, is_correct: i === 0 })),
      });
      return;
    }
    onChange({ ...form, questionType: t, choices: [] });
  };

  const addChoice = () => {
    if (form.choices.length >= 8) return;
    onChange({
      ...form,
      choices: [...form.choices, { content: "", is_correct: false, order: form.choices.length }],
    });
  };

  const removeChoice = (i: number) => {
    if (form.choices.length <= 2) return;
    onChange({
      ...form,
      choices: form.choices.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, order: idx })),
    });
  };

  const updateChoiceContent = (i: number, content: string) =>
    onChange({
      ...form,
      choices: form.choices.map((c, idx) => (idx === i ? { ...c, content } : c)),
    });

  const toggleChoiceCorrect = (i: number) =>
    onChange({
      ...form,
      choices: isSingleCorrect
        ? form.choices.map((c, idx) => ({ ...c, is_correct: idx === i }))
        : form.choices.map((c, idx) => (idx === i ? { ...c, is_correct: !c.is_correct } : c)),
    });

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm">
          {error}
        </div>
      )}

      <div>
        <Label className="text-xs font-medium mb-2 block">Savol turi</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`text-left p-3 rounded-[var(--radius-lg)] border-2 transition-all duration-200 ${
                form.questionType === t.value
                  ? "border-[var(--color-deep)] bg-[var(--color-deep)]/5"
                  : "border-[var(--color-line)] bg-white hover:border-[var(--color-deep)]/30"
              }`}
            >
              <p className="text-sm font-medium text-[var(--color-ink)]">{t.label}</p>
              <p className="text-xs text-[var(--color-slate)] mt-0.5">{t.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium mb-1 block">Savol matni *</Label>
        <textarea
          className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm min-h-[90px]"
          placeholder="Savol matnini yozing..."
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          autoFocus
        />
      </div>

      <div>
        <Label className="text-xs font-medium mb-1 block">Qo&apos;shimcha tavsif (ixtiyoriy)</Label>
        <textarea
          className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm min-h-[60px]"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium mb-1 block">Rasm URL (ixtiyoriy)</Label>
          <Input
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => onChange({ ...form, imageUrl: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium mb-1 block">Video URL (ixtiyoriy)</Label>
          <Input
            placeholder="https://..."
            value={form.videoUrl}
            onChange={(e) => onChange({ ...form, videoUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium mb-1 block">Ball</Label>
          <Input
            type="number"
            min={1}
            value={form.score}
            onChange={(e) => onChange({ ...form, score: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium mb-1 block">Qiyinlik darajasi</Label>
          <Select
            value={form.difficulty}
            onChange={(e) =>
              onChange({ ...form, difficulty: e.target.value as "easy" | "medium" | "hard" })
            }
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {isChoiceType && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Label className="text-xs font-medium">
              Variantlar {isSingleCorrect ? "(bittasi to'g'ri)" : "(bir nechtasi to'g'ri bo'lishi mumkin)"}
            </Label>
            {form.questionType !== "true_false" && form.choices.length < 8 && (
              <Button variant="ghost" size="sm" onClick={addChoice}>
                <Plus className="h-3.5 w-3.5" />
                Variant
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {form.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={isSingleCorrect ? "radio" : "checkbox"}
                  name="correct-choice"
                  checked={c.is_correct}
                  onChange={() => toggleChoiceCorrect(i)}
                  disabled={form.questionType === "true_false"}
                  className="w-4 h-4 accent-[var(--color-deep)] shrink-0"
                />
                <Input
                  placeholder={`Variant ${i + 1}`}
                  value={c.content}
                  onChange={(e) => updateChoiceContent(i, e.target.value)}
                  disabled={form.questionType === "true_false"}
                  className="flex-1"
                />
                {form.questionType !== "true_false" && form.choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeChoice(i)}
                    className="text-[var(--color-slate-light)] hover:text-[var(--color-danger)] shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {form.questionType === "short_answer" && (
        <div>
          <Label className="text-xs font-medium mb-1 block">To&apos;g&apos;ri javob *</Label>
          <Input
            placeholder="To'g'ri javob matnini yozing"
            value={form.correctAnswer}
            onChange={(e) => onChange({ ...form, correctAnswer: e.target.value })}
          />
          <p className="text-xs text-[var(--color-slate)] mt-1">
            Talaba javobi shu matn bilan (katta-kichik harfga sezgir bo&apos;lmagan holda) solishtiriladi.
          </p>
        </div>
      )}

      {form.questionType === "numeric" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1 block">To&apos;g&apos;ri son *</Label>
            <Input
              type="number"
              placeholder="Masalan: 42"
              value={form.correctAnswer}
              onChange={(e) => onChange({ ...form, correctAnswer: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block">Tolerantlik (±)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.numericTolerance}
              onChange={(e) => onChange({ ...form, numericTolerance: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}

      {form.questionType === "essay" && (
        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)] text-xs text-[var(--color-slate)]">
          Insho turidagi savollar avtomatik baholanmaydi — o&apos;qituvchi javoblarni qo&apos;lda tekshiradi.
        </div>
      )}

      <div>
        <Label className="text-xs font-medium mb-1 block">Tushuntirish (ixtiyoriy)</Label>
        <textarea
          className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm min-h-[60px]"
          placeholder="Javobdan keyin talabaga ko'rsatiladigan izoh..."
          value={form.explanation}
          onChange={(e) => onChange({ ...form, explanation: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-line)]">
        <Button variant="ghost" onClick={onCancel}>Bekor qilish</Button>
        <Button onClick={onSubmit} disabled={saving || !form.title.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
