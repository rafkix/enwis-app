export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  public_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  phone_verified: boolean;
  telegram_id: string | null;
  avatar: string | null;
  is_google_verified?: boolean;
  is_telegram_verified?: boolean;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  roles: string[];
  meta: {
    version?: number;
    bio?: string | null;
    birth_date?: string | null;
    ielts?: unknown;
    cefr?: unknown;
  } | null;
  is_teacher?: boolean;
  teacher_verified_at?: string | null;
  subscription_tier?: string;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  has_active_subscription: boolean;
  has_password?: boolean;
  // Onboarding: Google/Telegram orqali kirgan foydalanuvchilar telefonini
  // tasdiqlashi kerak bo'lganda true. Eski "parol o'rnating" bayrog'i
  // (requires_password_setup) endi bunday hisoblar uchun doim false —
  // frontend uni umuman ishlatmaydi, faqat requires_phone_verification'ga
  // qaraladi.
  requires_phone_verification?: boolean;
  requires_password_setup?: boolean;
  referral_code: string | null;
  xp?: number;
  level?: number;
  streak?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// FIX: username removed — backend auto-generates it from full_name.
// The two-step flow is: POST /auth/register/send-code (full_name+phone+password)
// then POST /auth/register/verify (phone+code). No username is ever collected.
export interface RegisterRequest {
  full_name: string;
  phone: string;
  password: string;
}

export interface SessionResponse {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_revoked: boolean;
  expires_at: string;
  last_used_at: string | null;
  created_at: string;
}

export interface DeviceResponse {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ReferralSummary {
  referral_code: string;
  invited_count: number;
  referral_url: string | null;
}

// GET /users/me/ai-usage
export interface AiUsage {
  tier: string;
  ai_questions_used: number;
  ai_questions_monthly_limit: number; // -1 means unlimited
  ai_questions_remaining: number;
  ai_questions_reset_at: string;
  has_ai_access: boolean;
  is_custom_quota: boolean;
}

export interface UserResponse {
  id: string;
  public_id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean;
  avatar: string | null;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  roles: string[];
  meta: Record<string, unknown> | null;
  has_password: boolean;
  referral_code: string | null;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

// ── Exam Types ──────────────────────────────────────────────────────

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  test_id: string;
  test_title: string | null;
  status: "draft" | "active" | "completed" | "archived";
  visibility: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  has_password: boolean;
  owner_id: string;
  questions_count: number;
  attempts_count: number;
  avg_score: number;
  created_at: string;
  updated_at: string;
}

export interface ExamList {
  id: string;
  title: string;
  status: string;
  visibility: string;
  test_id: string | null;
  questions_count: number;
  attempts_count: number;
  avg_score: number;
  created_at: string;
}

export interface ExamCreate {
  title: string;
  description?: string | null;
  test_id: string;
  visibility?: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  passing_score?: number;
  max_attempts?: number;
  password?: string | null;
}

export interface ExamUpdate {
  title?: string;
  description?: string | null;
  status?: string;
  visibility?: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  passing_score?: number;
  max_attempts?: number;
  password?: string | null;
}

export interface QuestionOption {
  id: string;
  content: string;
  is_correct: boolean;
  order: number;
}

// NOTE: ExamAttempt/ExamAttemptListItem/AttemptStartResponse types were
// removed -- there is no /exams namespace on the real backend, and nothing
// in the app references these anymore (dashboard stats now come from the
// real GET /dashboard/stats endpoint).

export interface ResumeResponse {
  attempt_id: string;
  exam_id: string;
  status: string;
  score: number | null;
  total_points: number;
  started_at: string;
  time_limit_minutes: number | null;
  time_remaining_seconds: number | null;
  saved_answers: SaveAnswerItem[];
  questions_count: number;
}

export interface SaveAnswerItem {
  question_id: string;
  selected_option_id?: string | null;
  selected_option_ids?: string[] | null;
  text_answer?: string | null;
}

export interface SaveAnswersRequest {
  answers: SaveAnswerItem[];
}

export interface SubmitResponse {
  attempt_id: string;
  status: string;
  score: number;
  total_points: number;
  percentage: number;
  grade: string | null;
  passed: boolean;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  time_spent_seconds: number;
  message: string;
}

export interface ResultResponse {
  attempt_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string | null;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  time_spent_seconds: number;
  passed: boolean;
  graded_by: string | null;
  graded_at: string | null;
}

export interface AttemptAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  points: number;
  selected_option_text: string | null;
  text_answer: string | null;
  correct_answer: string | null;
  correct_option_text: string | null;
  is_correct: boolean | null;
  points_earned: number;
  order: number;
  explanation: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ── Test Question Types (inline — created directly inside a Test) ──────
// NOTE: The standalone Question Bank module has been removed. Questions
// now live entirely inside a Test; there is no separate /questions/* API
// and no bank/category/tag concept anymore.

export type QuestionType =
  | "multiple_choice" // bitta to'g'ri javobli variantlar
  | "multiple_select" // bir nechta to'g'ri javobli variantlar
  | "true_false"
  | "short_answer"
  | "essay"
  | "numeric";

export interface TestQuestionChoice {
  id: string;
  content: string;
  is_correct: boolean;
  order: number;
}

export interface TestQuestionChoiceInput {
  content: string;
  is_correct: boolean;
  order: number;
}

// Full inline question — this is what /tests/{id}/questions returns and
// accepts directly (no join-record, no separate hydration step).
export interface TestQuestion {
  id: string;
  test_id: string;
  question_type: QuestionType;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  score: number;
  order: number;
  choices: TestQuestionChoice[];
  // short_answer / essay / numeric use this instead of choices
  correct_answer: string | null;
  // numeric only: allowed +/- tolerance when grading
  numeric_tolerance: number | null;
  created_at: string;
  updated_at: string;
  // ── Rasch (1-PL IRT) calibration fields ────────────────────────────
  // NOT YET returned by GET /tests/{id}/questions as of this writing —
  // only appears in the POST /tests/rasch/calibrate response items[].
  // Declared optional here so the UI compiles/works today (falls back
  // to "Kalibrlanmagan") and picks the real values up automatically
  // once the backend adds them to TestQuestion/QuestionResponse.
  irt_b?: number | null;
  irt_calibrated_at?: string | null;
  irt_n_responses?: number;
}

// ── Rasch (IRT) calibration & test generation ─────────────────────────
export interface RaschCalibrateRequest {
  question_ids?: string[] | null;
}

export interface RaschCalibratedItem {
  question_id: string;
  irt_b: number;
}

export interface RaschCalibrateResponse {
  calibrated: number;
  skipped: number;
  n_responses: number;
  n_persons: number;
  converged: boolean;
  iterations: number;
  items: RaschCalibratedItem[];
}

export interface RaschGenerateTestRequest {
  title: string;
  description?: string | null;
  target_theta?: number; // -4..+4, default 0
  num_questions: number;
  question_bank_id?: string | null;
  category_id?: string | null;
  require_calibrated?: boolean; // default true
  min_gap?: number; // default 0
}

export interface RaschInformationPoint {
  theta: number;
  information: number;
}

export interface RaschGenerateTestResponse {
  test: Test;
  target_theta: number;
  selected_question_ids: string[];
  difficulty_spread: { min_b?: number; max_b?: number;[key: string]: unknown };
  information_curve: RaschInformationPoint[];
}


export interface TestQuestionCreate {
  question_type: QuestionType;
  title: string;
  description?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  explanation?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  order?: number;
  choices?: TestQuestionChoiceInput[];
  correct_answer?: string | null;
  numeric_tolerance?: number | null;
}

export type TestQuestionUpdate = Partial<TestQuestionCreate>;

export interface TestQuestionAiGenerate {
  provider?: "openrouter" | "groq";
  subject: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  question_count: number;
  question_type?: QuestionType;
  language?: string;
}
// ── Enhanced Exam Types ──────────────────────────────────────────────

export interface ExamParticipant {
  id: string;
  exam_id: string;
  user_id: string;
  created_at: string;
}

export interface ExamParticipantAdd {
  user_id: string;
}

export interface DashboardStats {
  user: {
    xp: number;
    level: number;
    streak: number;
    subscription_tier: string;
  };
  tests: {
    total: number;
    draft: number;
    active: number;
    archived: number;
  };
  questions: {
    total: number;
    by_type: Record<string, number>;
    by_difficulty: Record<string, number>;
  };
  exams: {
    exams_created: number;
    exams_active: number;
  };
  attempts: {
    total_attempts: number;
    completed_attempts: number;
    average_score: number;
    average_percentage: number;
    best_percentage: number;
    worst_percentage: number;
    pass_count: number;
    fail_count: number;
    pass_rate: number;
  };
  certificates: {
    total: number;
  };
  unread_notifications: number;
}

// ── Test Types ──────────────────────────────────────────────────────

export interface Test {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  cover_image: string | null;
  test_type: string;
  status: "draft" | "active" | "completed" | "archived";
  visibility: string;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  negative_marking: boolean;
  auto_submit: boolean;
  show_result: boolean;
  allow_review: boolean;
  certificate_enabled: boolean;
  publish_at: string | null;
  expire_at: string | null;
  questions_count: number;
  attempts_count: number;
  avg_score: number;
  owner_id: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestList {
  id: string;
  title: string;
  test_type: string;
  status: string;
  visibility: string;
  questions_count: number;
  attempts_count: number;
  avg_score: number;
  created_at: string;
}

export interface TestCreate {
  title: string;
  description?: string;
  instructions?: string;
  cover_image?: string;
  test_type: string;
  visibility?: string;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  show_result?: boolean;
  allow_review?: boolean;
  negative_marking?: boolean;
  auto_submit?: boolean;
  publish_at?: string | null;
  expire_at?: string | null;
}

export interface TestUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  cover_image?: string;
  test_type?: string;
  status?: string;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  negative_marking?: boolean;
  auto_submit?: boolean;
  show_result?: boolean;
  allow_review?: boolean;
  visibility?: string;
  publish_at?: string | null;
  expire_at?: string | null;
}

export interface TestSettings {
  id: string;
  test_id: string;
  negative_marking: boolean;
  auto_submit: boolean;
  result_visibility: string;
  certificate_enabled: boolean;
}

export interface TestSettingsUpdate {
  negative_marking?: boolean;
  auto_submit?: boolean;
  result_visibility?: string;
  certificate_enabled?: boolean;
}

// ── Test Lifecycle Extras ────────────────────────────────────────────

export interface TestShareResult {
  slug: string;
  public_url: string;
}

export interface TestStatistics {
  questions_count: number;
  exams_count: number;
  times_used: number;
  average_score: number;
  average_time_seconds: number;
}

// GET /tests/{id}/preview — full test with its questions, for the owner
export interface TestPreview extends Test {
  questions: TestQuestion[];
}

// ── Import / Export ──────────────────────────────────────────────────

export interface TestImportPreviewResult {
  items: TestQuestionCreate[];
  count: number;
  errors: string[];
}

export interface TestImportResult {
  items: TestQuestion[];
}

// ── AI ────────────────────────────────────────────────────────────────

export interface AiProvider {
  name: string;
  is_available: boolean;
}

// improve/translate/explain results are not auto-saved — the dashboard
// shows the suggestion and only persists it if the user confirms, via a
// separate PATCH .../questions/{id} call (questions.update()).
export interface AiImproveResult {
  improved_text: string;
  explanation: string;
}

export interface AiTranslateResult {
  translated_text: string;
  source_language: string;
  target_language: string;
}

export interface AiExplainResult {
  explanation: string;
  key_concepts: string[];
  difficulty_note: string;
}

// ── Exam Apply / Certificate Types ─────────────────────────────────────

export interface ApplyLink {
  id: string;
  exam_id: string;
  code: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ApplyLinkCreate {
  max_uses?: number;
  expires_at?: string;
}

export interface Applicant {
  id: string;
  exam_id: string;
  user_id: string;
  user: {
    id: string;
    public_id: string;
    full_name: string | null;
    username: string | null;
    email: string | null;
    avatar: string | null;
  };
  message: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewer_id: string | null;
  created_at: string;
}

export interface ApplicantReview {
  status: "approved" | "rejected";
}

export interface BulkReview {
  applicant_ids: string[];
  status: "approved" | "rejected";
}

export interface ApplySubmit {
  message?: string;
}

export interface ApplicationStatus {
  status: "pending" | "approved" | "rejected" | "not_applied";
  applicant_id?: string;
  message?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface CertificateResponse {
  id: string;
  serial_number: string;
  recipient_name: string;
  exam_title: string;
  score_percentage: number;
  grade: string;
  issued_at: string;
  revoked_at: string | null;
  exam_id: string;
  user_id: string;
}

export interface CertificateListResponse {
  items: CertificateResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface AttemptDetail {
  id: string;
  exam_id: string;
  exam_title: string;
  user_id: string;
  username: string | null;
  status: string;
  score: number | null;
  total_points: number;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  answers: {
    question_id: string;
    question_text: string;
    question_type: string;
    points: number;
    selected_option_text: string | null;
    text_answer: string | null;
    correct_answer: string | null;
    correct_option_text: string | null;
    is_correct: boolean | null;
    points_earned: number;
    order: number;
    explanation: string | null;
  }[];
}

export interface LeaderboardResponse {
  exam_id: string;
  exam_title: string;
  entries: {
    rank: number;
    user_id: string;
    username: string;
    full_name: string;
    avatar: string | null;
    score: number;
    total_points: number;
    percentage: number;
    time_spent_seconds: number;
    completed_at: string;
  }[];
  total_entries: number;
}

export interface ExamStatsResponse {
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

// ── Question Analysis (CTT) Types ────────────────────────────────────
// GET /tests/{test_id}/questions/analysis

export interface QuestionAnalysisItem {
  question_id: string;
  title: string;
  question_type: string;
  difficulty: string;
  irt_b: number | null;
  irt_calibrated_at: string | null;
  times_answered: number;
  correct_count: number;
  wrong_count: number;
  correct_rate: number;
  discrimination: number | null;
  /** "ok" | "too_easy" | "too_hard" | "low_discrimination" | "insufficient_data" */
  flag: string;
}

export interface TestQuestionAnalysisResponse {
  test_id: string;
  questions_count: number;
  total_answers_considered: number;
  items: QuestionAnalysisItem[];
}

// ── Teacher Dashboard Types ───────────────────────────────────────────
// GET /dashboard/teacher

export interface TeacherOverview {
  total_students: number;
  active_students: number;
  student_growth_30d: number;
  total_tests: number;
  total_exams: number;
  total_questions: number;
  test_attempts: number;
  exam_attempts: number;
  total_attempts: number;
  average_score: number;
  average_difficulty: number;
  completion_rate: number;
  success_rate: number;
  pass_count: number;
  fail_count: number;
  revenue: number;
}

export interface RecentActivityItem {
  source: string;
  title: string;
  student_id: string;
  student_name: string;
  score_percentage: number;
  completed_at: string | null;
}

export interface PeriodPoint {
  period: string;
  attempts: number;
  new_students: number;
  average_score: number;
}

export interface TeacherDashboardResponse {
  overview: TeacherOverview;
  recent_activity: RecentActivityItem[];
  weekly: PeriodPoint[];
  monthly: PeriodPoint[];
}

// ── Notification Types ─────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  unread_count: number;
}

// ── Users/me Types ─────────────────────────────────────────────────

export interface ProfileUpdate {
  full_name?: string | null;
  username?: string | null;
  meta?: {
    version?: number;
    bio?: string;
    birth_date?: string;
    ielts?: Record<string, unknown>;
    cefr?: Record<string, unknown>;
  } | null;
}

export interface AccountSummary {
  profile: UserResponse;
  sessions: SessionResponse[];
  devices: DeviceResponse[];
  plan: SubscriptionPlan | null;
  referral: ReferralSummary;
  settings: UserSettings;
}

export interface UserSettings {
  language: string | null;
  timezone: string | null;
  email_notifications: boolean | null;
  sms_notifications: boolean | null;
  push_notifications: boolean | null;
  marketing_consent: boolean | null;
}

export interface UserSettingsUpdate {
  language?: string | null;
  timezone?: string | null;
  email_notifications?: boolean | null;
  sms_notifications?: boolean | null;
  push_notifications?: boolean | null;
  marketing_consent?: boolean | null;
}

// ── Social Auth Types ─────────────────────────────────────────────

export interface TelegramAuthPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface SocialLoginRequest {
  provider: "google" | "telegram";
  id_token?: string | null;
  telegram_data?: TelegramAuthPayload | null;
}

export interface SocialLinkResponse {
  provider: "google" | "telegram";
  linked: boolean;
  email: string | null;
}

// ── Subscription Types ─────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  tier: string;
  interval: string;
  price: number;
  currency: string;
  max_tests: number;
  max_attempts_per_test: number;
  max_participants_per_test: number;
  ai_generation: boolean;
  advanced_ai: boolean;
  certificate: boolean;
  priority_support: boolean;
  custom_branding: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// NOTE: Plan create/update/delete/seed now require the ADMIN role and
// live under /admin/plans/* (see app/modules/admin), not /subscriptions/*.
// These two types are kept here for the future admin panel to reuse —
// subscription.service.ts no longer calls any mutating plan endpoint.
export interface SubscriptionPlanCreate {
  name: string;
  display_name: string;
  description?: string | null;
  tier: string;
  interval?: string;
  price?: number;
  currency?: string;
  max_tests?: number;
  max_attempts_per_test?: number;
  max_participants_per_test?: number;
  ai_generation?: boolean;
  advanced_ai?: boolean;
  certificate?: boolean;
  priority_support?: boolean;
  custom_branding?: boolean;
  sort_order?: number;
}

export interface SubscriptionPlanUpdate {
  display_name?: string | null;
  description?: string | null;
  price?: number | null;
  max_tests?: number | null;
  max_attempts_per_test?: number | null;
  max_participants_per_test?: number | null;
  ai_generation?: boolean | null;
  advanced_ai?: boolean | null;
  certificate?: boolean | null;
  priority_support?: boolean | null;
  custom_branding?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
}

// Shape returned by GET /subscriptions/me and each item of
// GET /subscriptions/me/history's `items` array. The backend does NOT
// nest a full `plan` object — only `plan_name` (display name string).
export interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  tests_used: number;
  created_at: string;
}

// GET /subscriptions/me wraps the subscription (if any) in an `active` flag.
export interface MySubscriptionResponse extends Partial<Subscription> {
  active: boolean;
}

export interface SubscriptionHistoryResponse {
  items: Subscription[];
}

// ── Billing (manual card-transfer payments) ─────────────────────────
// Backend: app/modules/subscriptions/{billing_router,schemas}.py

export type PaymentStatus =
  | "pending"
  | "waiting_for_review"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type PaymentMethod = "manual_card" | "payme" | "click" | "uzcard";

export interface PaymentCard {
  id: string;
  card_number: string;
  card_holder_name: string;
  bank_name: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Billing System (Teacher Package + Pricing) ────────────────────
// Backend: app/modules/billing/

// FIX: Backend GET /billing/teacher-package returns ApiResponse<TeacherPackage>
// where data contains both top-level fields AND a nested `limits` object.
export interface TeacherPackageLimits {
  max_tests: number;
  max_attempts_per_test: number;
  max_participants_per_test: number;
  ai_generation: boolean;
  ai_questions_per_month: number;
  advanced_ai: boolean;
  exam_access: boolean;
  student_management: boolean;
  certificate: boolean;
  priority_support: boolean;
  csv_import: boolean;
  excel_import: boolean;
  custom_branding: boolean;
}

export interface TeacherPackage {
  available?: boolean;
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_active: boolean;
  limits: TeacherPackageLimits;
  created_at: string;
  updated_at: string;
}

export interface TeacherPurchase {
  id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  purchased_at: string;
  // The backend's teacher-package/purchase response shape isn't fully
  // documented in openapi (empty schema) — these are optional because we
  // can't guarantee they're present; the UI falls back to a separate
  // GET /payments/cards call when `card`/`card_id` is missing.
  card_id?: string | null;
  card?: PaymentCard | null;
  expires_at?: string | null;
}

export interface PricingPlanFeature {
  id: string;
  feature: string;
  sort_order: number;
}

// FIX: Backend GET /billing/pricing returns the full PricingPlan row including
// display_name, tier, limits sub-object, discount, and discounted_price.
export interface BillingPricingPlanLimits {
  max_tests: number;
  max_participants_per_test: number;
  ai_questions_per_month: number;
  exam_access: boolean;
  student_management: boolean;
  certificate: boolean;
}

export interface BillingPricingPlanDiscount {
  id: string;
  name: string;
  percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface BillingPricingPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  tier: string;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  is_purchasable: boolean;
  sort_order: number;
  is_default: boolean;
  features: PricingPlanFeature[];
  limits: BillingPricingPlanLimits;
  discount: BillingPricingPlanDiscount | null;
  discounted_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  plan_id: string;
  name: string;
  percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  plan_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  minimum_amount: number;
  plans: BillingPricingPlan[];
  created_at: string;
  updated_at: string;
}

export interface PromoCodeValidateResponse {
  valid: boolean;
  promo_code?: PromoCode;
  discount_amount?: number;
  final_amount?: number;
  message?: string;
}

export interface PromoCodeApplyResponse {
  valid: boolean;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  code: string;
}

export interface TeacherStatusResponse {
  is_teacher: boolean;
  teacher_verified_at: string | null;
  purchase: {
    amount: number;
    currency: string;
    purchased_at: string;
  } | null;
}

export interface PaymentHistoryItem {
  id: string;
  plan_id: string | null;
  plan_name: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaymentCardListResponse {
  items: PaymentCard[];
  total: number;
}

export interface PaymentEvent {
  id: string;
  from_status: PaymentStatus | null;
  to_status: PaymentStatus;
  actor_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  // Backend: plan_id is non-nullable UUID on the Payment model (subscription
  // payments always have a plan). TypeScript keeps string to avoid cast noise.
  plan_id: string;
  plan_name: string | null;
  card_id: string | null;
  card: PaymentCard | null;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  receipt_image: boolean;
  receipt_uploaded_at: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_note: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  events: PaymentEvent[];
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InitiatePaymentRequest {
  plan_id: string;
  method?: PaymentMethod;
  card_id?: string | null;
}

// What POST /billing/payments returns: the freshly-created PENDING
// payment plus the card(s) to show on the "pay to this card" screen.
export interface BillingCheckoutInfo {
  payment: Payment;
  cards: PaymentCard[];
}