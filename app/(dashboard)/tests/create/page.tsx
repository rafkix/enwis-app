"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Settings,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ApiError } from "@/lib/api";
import { testService } from "@/services/test.service";
import { useTestStore } from "@/stores/test";
import Link from "next/link";

function CreateTestContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { createTest } = useTestStore();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [testType, setTestType] = useState("single_choice");
  const [visibility, setVisibility] = useState("private");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [showResult, setShowResult] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [publishAt, setPublishAt] = useState("");
  const [expireAt, setExpireAt] = useState("");

  const TEST_TYPES = [
    { value: "single_choice", label: "Bitta javob" },
    { value: "multiple_choice", label: "Ko'p javob" },
    { value: "true_false", label: "To'g'ri/Noto'g'ri" },
    { value: "short_answer", label: "Qisqa javob" },
    { value: "essay", label: "Insho" },
    { value: "mixed", label: "Aralash" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Test nomini kiriting");
      return;
    }

    if (publishAt && expireAt && new Date(expireAt) <= new Date(publishAt)) {
      setError("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const test = await createTest({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        cover_image: coverUrl.trim() || undefined,
        test_type: testType,
        visibility,
        shuffle_questions: shuffleQuestions,
        shuffle_answers: shuffleAnswers,
        negative_marking: negativeMarking,
        auto_submit: autoSubmit,
        show_result: showResult,
        allow_review: allowReview,
        publish_at: publishAt ? new Date(publishAt).toISOString() : undefined,
        expire_at: expireAt ? new Date(expireAt).toISOString() : undefined,
      });

      // Cover fayli tanlangan bo'lsa, test yaratilgach yuklanadi —
      // backend `/tests/{id}/cover` endpointi mavjud testni talab qiladi.
      let coverUploaded = true;
      if (coverFile) {
        try {
          await testService.uploadCover(test.id, coverFile);
        } catch {
          coverUploaded = false;
        }
      }

      toast.success(coverUploaded ? "Test yaratildi" : "Test yaratildi, muqova yuklanmadi");
      router.push(`/tests/${test.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Test yaratishda xatolik");
    }

    setCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/tests"
          className="rounded-full p-2 text-[var(--color-slate)] hover:bg-[var(--color-mist)] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Yangi test yaratish
          </h1>
          <p className="text-[var(--color-slate)] mt-1">
            Test ma&apos;lumotlarini kiriting
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-volt)]/15 flex items-center justify-center">
              <FileText size={18} className="text-[var(--color-deep)]" />
            </div>
            Asosiy ma&apos;lumotlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Test nomi *
            </Label>
            <Input
              placeholder="Masalan: Matematika testi - 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Tavsif
            </Label>
            <textarea
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30 min-h-[80px]"
              placeholder="Test haqida qisqacha ma'lumot..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Ko&apos;rsatmalar (talabalarga)
            </Label>
            <textarea
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30 min-h-[80px]"
              placeholder="Test boshlanishidan oldin talabalar ko'radigan ko'rsatmalar..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Muqova rasmi
            </Label>
            <ImageUpload
              value={coverUrl || null}
              file={coverFile}
              onFileChange={setCoverFile}
              onUrlChange={setCoverUrl}
              hint="Rasm test sarlavhasida va natija sahifasida ko'rsatiladi."
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Test turi
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTestType(t.value)}
                  className={`p-3 rounded-[var(--radius-lg)] border-2 text-sm font-medium transition-all duration-200 ${
                    testType === t.value
                      ? "border-[var(--color-deep)] bg-[var(--color-deep)]/5 text-[var(--color-deep)]"
                      : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-deep)]/30"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2 p-4 rounded-[var(--radius-lg)] bg-[var(--color-mist)] border border-[var(--color-line)] text-sm text-[var(--color-slate)]">
          Vaqt chegarasi, o&apos;tish bali va urinishlar soni — bular imtihon (Exam) darajasida sozlanadi. Ushbu testdan imtihon yaratganingizda belgilaysiz.
        </div>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                <Settings size={18} className="text-[var(--color-deep)]" />
              </div>
              Xulq-atvor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Savollarni aralashtirish", desc: "Savollar tartibi tasodifiy bo'ladi", checked: shuffleQuestions, onChange: setShuffleQuestions },
              { label: "Javoblarni aralashtirish", desc: "Variantlar tartibi tasodifiy bo'ladi", checked: shuffleAnswers, onChange: setShuffleAnswers },
              { label: "Salb baholash", desc: "Noto'g'ri javoblar uchun ball ayiriladi", checked: negativeMarking, onChange: setNegativeMarking },
              { label: "Avtomatik topshirish", desc: "Vaqt tugaganda avtomatik yakalanadi", checked: autoSubmit, onChange: setAutoSubmit },
              { label: "Natijani ko'rsatish", desc: "Talabalar natijani ko'ra oladi", checked: showResult, onChange: setShowResult },
              { label: "Tekshirishga ruxsat", desc: "Talabalar javoblarini ko'ra oladi", checked: allowReview, onChange: setAllowReview },
            ].map(({ label, desc, checked, onChange }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{label}</p>
                  <p className="text-xs text-[var(--color-slate)]">{desc}</p>
                </div>
                <Switch
                  checked={checked}
                  onCheckedChange={onChange}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-volt)]/15 flex items-center justify-center">
                <Eye size={18} className="text-[var(--color-deep)]" />
              </div>
              Ko&apos;rinish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Ko&apos;rinish
              </Label>
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-48"
              >
                <option value="private">Maxfiy</option>
                <option value="public">Ommaviy</option>
                <option value="organization">Tashkilot ichida</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center">
                <Settings size={18} className="text-[var(--color-deep)]" />
              </div>
              Rejalashtirish
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                E&apos;lon qilinadigan vaqt
              </Label>
              <DateTimePicker
                value={publishAt || null}
                onChange={(v) => setPublishAt(v ?? "")}
                placeholder="Sana va vaqtni tanlang"
              />
              <p className="text-xs text-[var(--color-slate)] mt-1">
                Bo&apos;sh qoldirilsa, test darhol e&apos;lon qilinishi mumkin
              </p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Tugash vaqti
              </Label>
              <DateTimePicker
                value={expireAt || null}
                onChange={(v) => setExpireAt(v ?? "")}
                placeholder="Sana va vaqtni tanlang"
              />
              <p className="text-xs text-[var(--color-slate)] mt-1">
                Bo&apos;sh qoldirilsa, muddat cheklanmaydi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/tests">
          <Button variant="outline">Bekor qilish</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={creating || !title.trim()}>
          {creating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Yaratish
        </Button>
      </div>
    </div>
  );
}

export default function CreateTestPage() {
  return (
    <ToastProvider>
      <CreateTestContent />
    </ToastProvider>
  );
}
