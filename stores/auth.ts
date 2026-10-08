"use client";

import { create } from "zustand";
import { api, ApiError, clearAuthTokens, setAuthTokens } from "@/lib/api";
import { userService } from "@/services/user.service";
import type { ApiResponse, MeResponse } from "@/lib/types";

type UserRole = "user" | "teacher" | "admin";

export type { UserRole };

function mapRole(roles: string[]): UserRole {
  if (roles.includes("ADMIN") || roles.includes("admin")) return "admin";
  if (roles.includes("TEACHER") || roles.includes("teacher")) return "teacher";
  return "user";
}

interface AuthState {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  // Debug aid: mobile Telegram gives no access to devtools, so when the
  // silent Telegram auto-login fails we keep the reason here instead of
  // just swallowing it — the login screen shows it if present.
  telegramAuthError: string | null;

  fetchMe: () => Promise<void>;
  // Single-step signup: full_name + phone + password -> SMS code -> verify.
  // Backend auto-generates the username (ism.familiya) -- never collected here.
  registerSendCode: (
    fullName: string,
    phone: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  registerVerify: (phone: string, code: string) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  // Telegram Mini App auto-login — exchanges window.Telegram.WebApp.initData
  // for the same auth cookies a normal /auth/login would set. Returns true
  // on success so callers (AuthGuard, /login page) can decide what to do
  // next without having to catch the error themselves.
  loginWithTelegramWebApp: (initData: string, telegramPhotoUrl?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: MeResponse | null) => void;
  becomeTeacher: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  role: "user",
  telegramAuthError: null,

  fetchMe: async () => {
    try {
      const wrapped = await api.get<ApiResponse<MeResponse>>("/users/me");
      const res = wrapped.data;
      set({
        user: res,
        isAuthenticated: true,
        isLoading: false,
        role: mapRole(res.roles ?? []),
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        role: "user",
      });
    }
  },

  registerSendCode: async (fullName: string, phone: string, password: string) => {
    const res = await api.post<{ success: boolean; message: string }>(
      "/auth/register/send-code",
      { full_name: fullName, phone, password },
    );
    return res;
  },

  registerVerify: async (phone: string, code: string) => {
    const tokens = await api.post<import("@/lib/types").TokenResponse>("/auth/register/verify", { phone, code });
    setAuthTokens(tokens);
    const wrapped = await api.get<ApiResponse<MeResponse>>("/users/me");
    const res = wrapped.data;
    set({ user: res, isAuthenticated: true, role: mapRole(res.roles ?? []) });
  },

  login: async (identifier: string, password: string) => {
    const tokens = await api.post<import("@/lib/types").TokenResponse>("/auth/login", { username: identifier, password });
    setAuthTokens(tokens);
    const wrapped = await api.get<ApiResponse<MeResponse>>("/users/me");
    const res = wrapped.data;
    set({ user: res, isAuthenticated: true, role: mapRole(res.roles ?? []) });
  },

  loginWithTelegramWebApp: async (initData: string, telegramPhotoUrl?: string) => {
    if (!initData) {
      set({ telegramAuthError: "initData yo'q — window.Telegram.WebApp.initData bo'sh" });
      return false;
    }
    try {
      const tokens = await api.post<import("@/lib/types").TokenResponse>("/auth/telegram/webapp", { init_data: initData });
      setAuthTokens(tokens);
      const wrapped = await api.get<ApiResponse<MeResponse>>("/users/me");
      let res = wrapped.data;

      // Carry the Telegram profile photo over as the account avatar the
      // first time this user is seen — only if they don't already have
      // one (don't clobber an avatar they've since uploaded themselves).
      if (!res.avatar && telegramPhotoUrl) {
        try {
          await userService.setAvatarUrl(telegramPhotoUrl);
          const refreshed = await api.get<ApiResponse<MeResponse>>("/users/me");
          res = refreshed.data;
        } catch {
          // Non-fatal — user is still logged in, just without an avatar.
        }
      }

      set({
        user: res,
        isAuthenticated: true,
        isLoading: false,
        telegramAuthError: null,
        role: mapRole(res.roles ?? []),
      });

      return true;
    } catch (err) {
      // Previously silent — but on mobile Telegram there's no devtools to
      // see *why* auto-login failed, so we keep the reason for the UI.
      const reason =
        err instanceof ApiError
          ? `${err.status}: ${err.detail}`
          : err instanceof Error
            ? err.message
            : "Noma'lum xatolik";
      set({ telegramAuthError: reason });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      clearAuthTokens();
      set({ user: null, isAuthenticated: false, role: "user" });
    }
  },

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, role: mapRole(user?.roles ?? []) }),

  // FIX: POST /users/me/become-teacher no longer grants the TEACHER role —
  // it returns a 400 with guidance to use the Teacher Package purchase flow.
  // This action now just refreshes the user profile (useful after an admin
  // manually grants the role, or after the billing flow completes).
  becomeTeacher: async () => {
    const wrapped = await api.get<ApiResponse<MeResponse>>("/users/me");
    const res = wrapped.data;
    set({ user: res, role: mapRole(res.roles ?? []) });
  },

  hasRole: (roles) => {
    const { role } = get();
    return roles.includes(role);
  },
}));
