import { api } from "@/lib/api";
import type {
  Test,
  TestList,
  TestCreate,
  TestUpdate,
  TestSettings,
  TestSettingsUpdate,
  TestShareResult,
  TestStatistics,
  TestPreview,
  TestQuestion,
  TestQuestionCreate,
  TestQuestionUpdate,
  TestQuestionAiGenerate,
  AiImproveResult,
  AiTranslateResult,
  AiExplainResult,
  TestImportPreviewResult,
  TestImportResult,
  AiProvider,
  PaginatedResponse,
  RaschCalibrateRequest,
  RaschCalibrateResponse,
  RaschGenerateTestRequest,
  RaschGenerateTestResponse,
  TestQuestionAnalysisResponse,
} from "@/lib/types";

export const testService = {
  // GET /tests/my — "my tests" list, not the bare /tests collection
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), limit: String(params?.limit ?? 20) });
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return api.get<PaginatedResponse<TestList>>(`/tests/my?${qs.toString()}`);
  },

  get: (id: string) => api.get<Test>(`/tests/${id}`),

  create: (data: TestCreate) => api.post<Test>("/tests", data),

  update: (id: string, data: TestUpdate) =>
    api.put<Test>(`/tests/${id}`, data),

  // Test muqovasini rasm fayl sifatida yuklash (JPEG/PNG/WebP, 5MB gacha).
  // Test avval yaratilishi kerak — endpoint `/tests/{id}/cover` shu sababli
  // alohida chaqiriladi (create -> uploadCover).
  uploadCover: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("cover", file);
    return api.postUpload<Test>(`/tests/${id}/cover`, fd);
  },

  // 409 if an Exam is linked to this test — archive instead of deleting
  delete: (id: string) => api.delete(`/tests/${id}`),

  // ── Lifecycle: draft -> active -> archived, plus duplicate/share ──────
  publish: (id: string) => api.post<Test>(`/tests/${id}/publish`),

  // active -> draft, so questions can be edited again
  unpublish: (id: string) => api.post<Test>(`/tests/${id}/unpublish`),

  archive: (id: string) => api.post<Test>(`/tests/${id}/archive`),

  duplicate: (id: string) => api.post<Test>(`/tests/${id}/duplicate`),

  // Sets visibility=public, returns the public slug/link (test.enwis.uz/t/{slug})
  share: (id: string) => api.post<TestShareResult>(`/tests/${id}/share`),

  // Full test + questions, for the owner to review before editing
  preview: (id: string) => api.get<TestPreview>(`/tests/${id}/preview`),

  // questions_count, exams_count, times_used, average_score, average_time_seconds
  statistics: (id: string) => api.get<TestStatistics>(`/tests/${id}/statistics`),

  settings: {
    get: (testId: string) =>
      api.get<TestSettings>(`/tests/${testId}/settings`),
    update: (testId: string, data: TestSettingsUpdate) =>
      api.put<TestSettings>(`/tests/${testId}/settings`, data),
  },

  // ── Questions — created and edited entirely inside the Test. No bank,
  // no separate question page/API. Matches the ENWIS architecture spec.
  // NOTE: while the test is `active` (published), add/edit/delete/import/
  // reorder are all blocked with 409 TestNotEditableException — unpublish
  // first, or duplicate the test to get an editable copy. ──────────────
  questions: {
    list: (testId: string) =>
      api.get<TestQuestion[]>(`/tests/${testId}/questions`),

    create: (testId: string, data: TestQuestionCreate) =>
      api.post<TestQuestion>(`/tests/${testId}/questions`, data),

    update: (testId: string, questionId: string, data: TestQuestionUpdate) =>
      api.patch<TestQuestion>(`/tests/${testId}/questions/${questionId}`, data),

    delete: (testId: string, questionId: string) =>
      api.delete(`/tests/${testId}/questions/${questionId}`),

    reorder: (testId: string, questionIds: string[]) =>
      api.patch(`/tests/${testId}/questions/reorder`, { question_ids: questionIds }),

    // CTT item analysis — difficulty, discrimination, correct_rate per question.
    // Faqat urinishlar bo'lganda ma'lumotli bo'ladi (bo'lmasa bo'sh items[] qaytadi).
    analysis: (testId: string) =>
      api.get<TestQuestionAnalysisResponse>(`/tests/${testId}/questions/analysis`),

    generateAi: (testId: string, data: TestQuestionAiGenerate) =>
      api.post<TestQuestion[]>(`/tests/${testId}/questions/ai`, data),

    // Result is NOT auto-saved — show it to the user, and only persist via
    // questions.update() (PATCH) once they confirm.
    ai: {
      improve: (testId: string, questionId: string) =>
        api.post<AiImproveResult>(`/tests/${testId}/questions/${questionId}/ai/improve`),

      translate: (testId: string, questionId: string, targetLanguage: string) =>
        api.post<AiTranslateResult>(
          `/tests/${testId}/questions/${questionId}/ai/translate?target_language=${encodeURIComponent(targetLanguage)}`
        ),

      explain: (testId: string, questionId: string, language: string) =>
        api.post<AiExplainResult>(
          `/tests/${testId}/questions/${questionId}/ai/explain?language=${encodeURIComponent(language)}`
        ),
    },
  },

  // Available AI providers (e.g. "gemini") — check before showing the
  // generate-with-AI UI; also gated to PRO/PREMIUM plans server-side (403).
  ai: {
    providers: () => api.get<AiProvider[]>("/tests/ai/providers"),
  },

  // ── Rasch (1-PL IRT) — owner-scoped across ALL of the user's tests,
  // not nested under a single test. 404/403 on someone else's question
  // is handled by the global error-handler like everything else. ──────
  rasch: {
    calibrate: (data: RaschCalibrateRequest) =>
      api.post<RaschCalibrateResponse>("/tests/rasch/calibrate", data),

    generate: (data: RaschGenerateTestRequest) =>
      api.post<RaschGenerateTestResponse>("/tests/rasch/generate", data),
  },

  // ── Import — JSON / Excel / CSV, all scoped to this test. Preview first
  // (nothing is saved), show errors/rows, then call the real import. ────
  import: {
    preview: {
      json: (testId: string, questions: TestQuestionCreate[]) =>
        api.post<TestImportPreviewResult>(`/tests/${testId}/import/json/preview`, questions),
      excel: (testId: string, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        return api.postUpload<TestImportPreviewResult>(`/tests/${testId}/import/excel/preview`, fd);
      },
      csv: (testId: string, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        return api.postUpload<TestImportPreviewResult>(`/tests/${testId}/import/csv/preview`, fd);
      },
    },

    json: (testId: string, questions: TestQuestionCreate[]) =>
      api.post<TestImportResult>(`/tests/${testId}/import/json`, questions),
    excel: (testId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.postUpload<TestImportResult>(`/tests/${testId}/import/excel`, fd);
    },
    csv: (testId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.postUpload<TestImportResult>(`/tests/${testId}/import/csv`, fd);
    },
  },

  // ── Export — JSON / Excel / CSV, all scoped to this test ──────────────
  export: {
    json: (testId: string) => api.get(`/tests/${testId}/export/json`),
    excel: (testId: string) => api.getBlob(`/tests/${testId}/export/excel`),
    csv: (testId: string) => api.getBlob(`/tests/${testId}/export/csv`),
  },

  // ── Import template — bo'sh shablon, testga bog'liq emas ─────────────
  importTemplate: {
    excel: () => api.getBlob(`/tests/import-template/excel`),
    csv: () => api.getBlob(`/tests/import-template/csv`),
  },
};