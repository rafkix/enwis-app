import { api } from "@/lib/api";
import type {
  ApiResponse,
  UserResponse,
  ProfileUpdate,
  AccountSummary,
  ReferralSummary,
  SessionResponse,
  UserSettings,
  UserSettingsUpdate,
  MessageResponse,
  AiUsage,
} from "@/lib/types";

export const userService = {
  // ── Profile ─────────────────────────────────────────────────────
  me: () => api.get<ApiResponse<UserResponse>>("/users/me"),

  updateProfile: (data: ProfileUpdate) =>
    api.put<ApiResponse<UserResponse>>("/users/me", data),

  deleteAccount: (password?: string) =>
    api.delete<ApiResponse<MessageResponse>>("/users/me", { password }),

  accountSummary: () =>
    api.get<ApiResponse<AccountSummary>>("/users/me/account"),

  referral: () => api.get<ApiResponse<ReferralSummary>>("/users/me/referral"),

  // AI-generatsiya kvotasi — har bir tarifning oylik limiti, qolgan soni.
  // ai_questions_monthly_limit === -1 => cheksiz.
  aiUsage: () => api.get<ApiResponse<AiUsage>>("/users/me/ai-usage"),

  // ── Avatar ──────────────────────────────────────────────────────
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.upload<ApiResponse<UserResponse>>(
      "/users/me/avatar/upload",
      fd,
    );
  },

  setAvatarUrl: (avatar_url: string) =>
    api.patch<ApiResponse<UserResponse>>("/users/me/avatar/url", {
      avatar_url,
    }),

  // NOTE: password changes live on authService (POST /auth/set-password,
  // POST /auth/change-password) -- /users/me/password/* does not exist.

  // ── Sessions ────────────────────────────────────────────────────
  // (there is no separate "devices" endpoint -- sessions is the real one)
  sessions: () =>
    api.get<ApiResponse<SessionResponse[]>>("/users/me/sessions"),

  revokeAllOtherSessions: (current_session_id: string) =>
    api.delete<ApiResponse<MessageResponse>>("/users/me/sessions", {
      current_session_id,
    }),

  revokeSession: (sessionId: string) =>
    api.delete<ApiResponse<MessageResponse>>(
      `/users/me/sessions/${sessionId}`,
    ),

  // ── Settings ────────────────────────────────────────────────────
  updateSettings: (data: UserSettingsUpdate) =>
    api.patch<ApiResponse<UserSettings>>("/users/me/settings", data),

  // ── Phone number change (for an already logged-in account) ─────
  requestPhoneChange: (phone: string) =>
    api.post<ApiResponse<MessageResponse>>("/users/me/phone/request", {
      phone,
    }),

  verifyPhoneChange: (phone: string, code: string) =>
    api.post<ApiResponse<MessageResponse>>("/users/me/phone/verify", {
      phone,
      code,
    }),

  // ── Teacher role ────────────────────────────────────────────────
  becomeTeacher: () =>
    api.post<ApiResponse<MessageResponse>>("/users/me/become-teacher"),

  teacherStatus: () =>
    api.get<ApiResponse<{
      is_teacher: boolean;
      teacher_verified_at: string | null;
      purchase: { amount: number; currency: string; purchased_at: string } | null;
    }>>("/users/me/teacher-status"),

  purchaseHistory: () =>
    api.get<ApiResponse<{ items: Array<{
      id: string;
      amount: number;
      currency: string;
      payment_method: string;
      status: string;
      purchased_at: string;
    }> }>>("/users/me/purchases"),

  paymentHistory: (page = 1, perPage = 20) =>
    api.get<ApiResponse<{
      items: Array<{
        id: string;
        plan_id: string | null;
        plan_name: string | null;
        amount: number;
        currency: string;
        status: string;
        method: string;
        created_at: string;
        reviewed_at: string | null;
      }>;
      total: number;
      page: number;
      per_page: number;
    }>>(`/users/me/payments?page=${page}&per_page=${perPage}`),
};
