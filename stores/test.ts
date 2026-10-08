"use client";

import { create } from "zustand";
import { testService } from "@/services/test.service";
import type {
  Test,
  TestList,
  TestCreate,
  TestUpdate,
  TestSettings,
  TestSettingsUpdate,
  TestShareResult,
  TestQuestion,
  TestQuestionCreate,
  TestQuestionUpdate,
  TestQuestionAiGenerate,
} from "@/lib/types";

interface TestState {
  tests: TestList[];
  totalTests: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  currentTest: Test | null;
  currentQuestions: TestQuestion[];

  fetchTests: (params?: {
    page?: number;
    status?: string;
    search?: string;
  }) => Promise<void>;
  fetchTest: (id: string) => Promise<void>;
  createTest: (data: TestCreate) => Promise<Test>;
  updateTest: (id: string, data: TestUpdate) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  publishTest: (id: string) => Promise<void>;
  unpublishTest: (id: string) => Promise<void>;
  archiveTest: (id: string) => Promise<void>;
  duplicateTest: (id: string) => Promise<Test>;
  shareTest: (id: string) => Promise<TestShareResult>;

  fetchTestSettings: (id: string) => Promise<TestSettings>;
  updateTestSettings: (id: string, data: TestSettingsUpdate) => Promise<void>;

  fetchQuestions: (testId: string) => Promise<void>;
  addQuestion: (testId: string, data: TestQuestionCreate) => Promise<TestQuestion>;
  updateQuestion: (testId: string, questionId: string, data: TestQuestionUpdate) => Promise<void>;
  deleteQuestion: (testId: string, questionId: string) => Promise<void>;
  duplicateQuestion: (testId: string, question: TestQuestion) => Promise<void>;
  reorderQuestions: (testId: string, questionIds: string[]) => Promise<void>;

  importQuestionsJson: (testId: string, file: File) => Promise<void>;
  importQuestionsExcel: (testId: string, file: File) => Promise<void>;
  importQuestionsCsv: (testId: string, file: File) => Promise<void>;

  exportQuestionsJson: (testId: string) => Promise<unknown>;
  exportQuestionsExcel: (testId: string) => Promise<Blob>;
  exportQuestionsCsv: (testId: string) => Promise<Blob>;

  generateQuestionsAI: (testId: string, data: TestQuestionAiGenerate) => Promise<TestQuestion[]>;

  clearTest: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  tests: [],
  totalTests: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  currentTest: null,
  currentQuestions: [],

  fetchTests: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await testService.list(params);
      set({
        tests: data.items,
        totalTests: data.total,
        currentPage: data.page,
        totalPages: data.pages,
        isLoading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xatolik yuz berdi";
      set({ isLoading: false, error: msg });
    }
  },

  fetchTest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const test = await testService.get(id);
      set({ currentTest: test, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xatolik yuz berdi";
      set({ isLoading: false, error: msg });
    }
  },

  createTest: async (data) => {
    const test = await testService.create(data);
    const { tests } = get();
    set({
      tests: [
        {
          id: test.id,
          title: test.title,
          test_type: test.test_type,
          status: test.status,
          visibility: test.visibility,
          questions_count: 0,
          attempts_count: 0,
          avg_score: 0,
          created_at: test.created_at,
        },
        ...tests,
      ],
      totalTests: get().totalTests + 1,
    });
    return test;
  },

  updateTest: async (id, data) => {
    const test = await testService.update(id, data);
    const { tests } = get();
    set({
      tests: tests.map((t) =>
        t.id === id
          ? { ...t, title: test.title, test_type: test.test_type, status: test.status, visibility: test.visibility }
          : t
      ),
      currentTest: test,
    });
  },

  deleteTest: async (id) => {
    await testService.delete(id);
    const { tests } = get();
    set({
      tests: tests.filter((t) => t.id !== id),
      totalTests: get().totalTests - 1,
    });
  },

  publishTest: async (id) => {
    const test = await testService.publish(id);
    set({ currentTest: test });
  },

  // active -> draft, so the title/settings/questions become editable again
  unpublishTest: async (id) => {
    const test = await testService.unpublish(id);
    set({ currentTest: test });
  },

  archiveTest: async (id) => {
    const test = await testService.archive(id);
    set({ currentTest: test });
  },

  duplicateTest: async (id) => {
    const test = await testService.duplicate(id);
    return test;
  },

  shareTest: async (id) => {
    // Backend visibility'ni "public" ga o'tkazadi va
    // https://test.enwis.uz/tests/{slug} havolasini qaytaradi — testni
    // ko'rish uchun yo'naltiruvchi havola.
    const result = await testService.share(id);
    set((state) => ({
      currentTest: state.currentTest
        ? { ...state.currentTest, visibility: "public" }
        : state.currentTest,
    }));
    return result;
  },

  fetchTestSettings: async (id) => {
    return testService.settings.get(id);
  },

  updateTestSettings: async (id, data) => {
    await testService.settings.update(id, data);
  },

  fetchQuestions: async (testId) => {
    const items = await testService.questions.list(testId);
    set({ currentQuestions: [...items].sort((a, b) => a.order - b.order) });
  },

  addQuestion: async (testId, data) => {
    const question = await testService.questions.create(testId, data);
    const { currentTest, currentQuestions } = get();
    if (currentTest && currentTest.id === testId) {
      set({
        currentTest: {
          ...currentTest,
          questions_count: (currentTest.questions_count || 0) + 1,
        },
      });
    }
    set({ currentQuestions: [...currentQuestions, question].sort((a, b) => a.order - b.order) });
    return question;
  },

  updateQuestion: async (testId, questionId, data) => {
    const updated = await testService.questions.update(testId, questionId, data);
    set({
      currentQuestions: get().currentQuestions.map((q) => (q.id === questionId ? updated : q)),
    });
  },

  deleteQuestion: async (testId, questionId) => {
    await testService.questions.delete(testId, questionId);
    const { currentTest } = get();
    if (currentTest && currentTest.id === testId) {
      set({
        currentTest: {
          ...currentTest,
          questions_count: Math.max(0, (currentTest.questions_count || 1) - 1),
        },
      });
    }
    set({ currentQuestions: get().currentQuestions.filter((q) => q.id !== questionId) });
  },

  // No dedicated /duplicate endpoint is specified for a single question, so
  // this composes the copy client-side from the already-loaded question and
  // creates it as a new one via the normal create endpoint.
  duplicateQuestion: async (testId, question) => {
    const copy = await testService.questions.create(testId, {
      question_type: question.question_type,
      title: `${question.title} (nusxa)`,
      description: question.description ?? undefined,
      image_url: question.image_url ?? undefined,
      video_url: question.video_url ?? undefined,
      explanation: question.explanation ?? undefined,
      difficulty: question.difficulty,
      score: question.score,
      choices: question.choices.map((c) => ({ content: c.content, is_correct: c.is_correct, order: c.order })),
      correct_answer: question.correct_answer ?? undefined,
      numeric_tolerance: question.numeric_tolerance ?? undefined,
    });
    const { currentTest, currentQuestions } = get();
    if (currentTest && currentTest.id === testId) {
      set({
        currentTest: {
          ...currentTest,
          questions_count: (currentTest.questions_count || 0) + 1,
        },
      });
    }
    set({ currentQuestions: [...currentQuestions, copy].sort((a, b) => a.order - b.order) });
  },

  reorderQuestions: async (testId, questionIds) => {
    // Optimistic reorder — update local state immediately, then persist.
    const { currentQuestions } = get();
    const byId = new Map(currentQuestions.map((q) => [q.id, q]));
    const reordered = questionIds
      .map((id, i) => {
        const q = byId.get(id);
        return q ? { ...q, order: i } : null;
      })
      .filter((q): q is TestQuestion => q !== null);
    set({ currentQuestions: reordered });
    await testService.questions.reorder(testId, questionIds);
  },

  importQuestionsExcel: async (testId, file) => {
    await testService.import.excel(testId, file);
    await get().fetchQuestions(testId);
  },

  importQuestionsJson: async (testId, file) => {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Noto'g'ri JSON fayl formati");
    }
    const questions = Array.isArray(parsed)
      ? parsed
      : (parsed as { questions?: unknown[] })?.questions;
    if (!Array.isArray(questions)) {
      throw new Error("JSON faylda 'questions' massivi topilmadi");
    }
    await testService.import.json(testId, questions);
    await get().fetchQuestions(testId);
  },

  importQuestionsCsv: async (testId, file) => {
    await testService.import.csv(testId, file);
    await get().fetchQuestions(testId);
  },

  exportQuestionsJson: async (testId) => testService.export.json(testId),
  exportQuestionsExcel: async (testId) => testService.export.excel(testId),
  exportQuestionsCsv: async (testId) => testService.export.csv(testId),

  generateQuestionsAI: async (testId, data) => {
    const generated = await testService.questions.generateAi(testId, data);
    await get().fetchQuestions(testId);
    return generated;
  },

  clearTest: () => set({ currentTest: null, currentQuestions: [] }),
}));