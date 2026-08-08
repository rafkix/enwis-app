import { api } from "@/lib/api";
import type {
  ApiResponse,
  MeResponse,
  TokenResponse,
  LoginRequest,
  MessageResponse,
  TelegramAuthPayload,
  SocialLinkResponse,
} from "@/lib/types";

// NOTE: profile, `/account`, and sessions are NOT part of the auth module —
// GET /auth/me and the old /auth/sessions/* endpoints were removed from the
// backend. Use userService (me, accountSummary, sessions, revokeSession,
// requestPhoneChange, verifyPhoneChange, etc.) for those — see
// services/user.service.ts, which already targets /users/me/*.
export const authService = {
  // ── Classic auth ────────────────────────────────────────────────
  me: () => api.get<ApiResponse<MeResponse>>("/users/me"),

  login: (data: LoginRequest) => api.post<TokenResponse>("/auth/login", data),

  // refresh_token is optional — the backend falls back to the cookie.
  refresh: (refresh_token?: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }),

  logout: (refresh_token?: string) =>
    api.post<MessageResponse>("/auth/logout", { refresh_token }),

  logoutAll: () => api.post<MessageResponse>("/auth/logout-all"),

  // ── Passwords ───────────────────────────────────────────────────
  setPassword: (new_password: string) =>
    api.post<MessageResponse>("/auth/set-password", { new_password }),

  changePassword: (current_password: string, new_password: string) =>
    api.post<MessageResponse>("/auth/change-password", {
      current_password,
      new_password,
    }),

  // Password reset is phone/SMS based (2 steps), not email/token based.
  forgotPasswordSendCode: (phone: string) =>
    api.post<MessageResponse>("/auth/forgot-password/send-code", { phone }),

  forgotPasswordReset: (phone: string, code: string, new_password: string) =>
    api.post<MessageResponse>("/auth/forgot-password/reset", {
      phone,
      code,
      new_password,
    }),

  // ── Register — the one and only signup flow (doc §2.1) ──────────
  // Step 1: full_name + phone + password → SMS code. Step 2: phone + code
  // → TokenResponse. The backend auto-generates the username
  // ("ism.familiya") — it is never collected from the user.
  registerSendCode: (full_name: string, phone: string, password: string) =>
    api.post<MessageResponse>("/auth/register/send-code", {
      full_name,
      phone,
      password,
    }),

  registerVerify: (phone: string, code: string) =>
    api.post<TokenResponse>("/auth/register/verify", { phone, code }),

  // ── Social Login (no session required) ─────────────────────────
  googleLogin: async (id_token: string) => {
    const tokens = await api.post<TokenResponse>("/auth/google", {
      provider: "google",
      id_token,
    });
    return tokens;
  },

  telegramLogin: (telegram_data: TelegramAuthPayload) =>
    api.post<TokenResponse>("/auth/telegram", {
      provider: "telegram",
      telegram_data,
    }),

  // ── Telegram Mini App (web3.enwis.uz) — initData based login ──────
  // initData: window.Telegram.WebApp.initData (raw string, not parsed)
  telegramWebApp: (initData: string) =>
    api.post<TokenResponse>("/auth/telegram/webapp", { init_data: initData }),

  // ── Social account linking (requires an existing session) ──────
  linkGoogle: (id_token: string) =>
    api.post<SocialLinkResponse>("/auth/google/link", { id_token }),

  unlinkGoogle: () => api.delete<SocialLinkResponse>("/auth/google/link"),

  linkTelegram: (telegram_data: TelegramAuthPayload) =>
    api.post<SocialLinkResponse>("/auth/telegram/link", { telegram_data }),

  unlinkTelegram: () => api.delete<SocialLinkResponse>("/auth/telegram/link"),
};
