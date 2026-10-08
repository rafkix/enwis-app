import { api } from "@/lib/api";

// ── Admin Dashboard ───────────────────────────────────────────────────

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    pending: number;
    new_today: number;
    new_this_week: number;
  };
  payments: {
    pending: number;
    waiting_for_review: number;
    approved: number;
    rejected: number;
    expired: number;
    cancelled: number;
    total_revenue: number;
    combined_pending: number;
    combined_waiting_for_review: number;
    combined_revenue: number;
    teacher_purchases: {
      pending: number;
      waiting_for_review: number;
      completed: number;
      rejected: number;
      expired: number;
      cancelled: number;
      revenue: number;
    };
  };
  subscriptions: {
    active: number;
    by_tier: Record<string, number>;
  };
  content: {
    total_tests: number;
    total_questions: number;
    total_exams: number;
    total_attempts: number;
    total_certificates: number;
  };
}

// ── Users ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  public_id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  status: "pending" | "active" | "blocked";
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  subscription_tier: string;
  ai_questions_used: number;
  ai_questions_quota_override: number | null;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Payments ──────────────────────────────────────────────────────────

export interface AdminPayment {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_name: string | null;
  card_id: string | null;
  card: { bank_name: string | null; card_number: string } | null;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  receipt_image: boolean;
  receipt_uploaded_at: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  rejection_reason?: string | null;
}

export interface AdminPaymentsResponse {
  items: AdminPayment[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Plans ─────────────────────────────────────────────────────────────

// FIX: Backend PlanResponse (GET/POST/PUT /admin/plans/*) returns all of
// these fields. Previously missing: student_management, certificate,
// priority_support, csv_import, excel_import, is_purchasable, sort_order.
export interface AdminPlan {
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
  ai_questions_per_month: number;
  advanced_ai: boolean;
  exam_access: boolean;
  student_management: boolean;
  certificate: boolean;
  priority_support: boolean;
  csv_import: boolean;
  excel_import: boolean;
  is_purchasable: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPlansResponse {
  items: AdminPlan[];
  total: number;
}

// ── Cards ─────────────────────────────────────────────────────────────

export interface AdminCard {
  id: string;
  bank_name: string;
  card_number: string;
  card_holder_name: string;   // was: card_holder (wrong field name)
  is_active: boolean;
  sort_order: number;         // was: missing
}

export interface AdminCardsResponse {
  items: AdminCard[];
  total: number;
}

// ── Teacher package purchases (separate one-time-purchase moderation
// queue — distinct from /admin/payments, which only covers recurring
// subscription payments) ────────────────────────────────────────────

export interface AdminTeacherPurchase {
  id: string;
  user_id: string;
  package_id: string;
  card_id: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_ref: string | null;
  status: string;
  receipt_image: boolean;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  purchased_at: string;
}

export interface AdminTeacherPurchasesResponse {
  items: AdminTeacherPurchase[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Teacher package (admin view — pricing/features/quota editing) ─────

export interface AdminTeacherPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_active: boolean;
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
  created_at: string;
  updated_at: string;
}

export type AdminTeacherPackageUpdate = Partial<
  Omit<AdminTeacherPackage, "id" | "created_at" | "updated_at">
>;

// ── Admin pricing plans (subscription pricing page — separate object
// from /admin/plans, which is the internal plan/tier limits table) ────

export interface AdminPricingFeature {
  id: string;
  plan_id: string;
  feature: string;
  sort_order: number;
  created_at: string;
}

export interface AdminDiscountInfo {
  id: string;
  name: string;
  percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface AdminPricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  sort_order: number;
  is_default: boolean;
  features: AdminPricingFeature[];
  discount: AdminDiscountInfo | null;
  discounted_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPricingPlansResponse {
  items: AdminPricingPlan[];
  total: number;
}

export interface AdminPricingPlanUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  is_active?: boolean;
  features?: { feature: string; sort_order?: number }[];
}

// ── Discounts ─────────────────────────────────────────────────────────

export interface AdminDiscount {
  id: string;
  plan_id: string;
  name: string;
  percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminDiscountsResponse {
  items: AdminDiscount[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminDiscountCreate {
  plan_id: string;
  name: string;
  percentage: number;
  start_date: string;
  end_date: string;
}

export type AdminDiscountUpdate = Partial<
  Omit<AdminDiscount, "id" | "plan_id" | "created_at" | "updated_at">
>;

// ── Promo codes ───────────────────────────────────────────────────────

export interface AdminPromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  minimum_amount: number;
  plans: AdminPricingPlan[];
  created_at: string;
  updated_at: string;
}

export interface AdminPromoCodesResponse {
  items: AdminPromoCode[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminPromoCodeCreate {
  code: string;
  discount_type?: string;
  discount_value: number;
  usage_limit?: number;
  per_user_limit?: number;
  is_active?: boolean;
  valid_from: string;
  valid_until: string;
  minimum_amount?: number;
  plan_ids?: string[];
}

export type AdminPromoCodeUpdate = Partial<
  Omit<AdminPromoCode, "id" | "used_count" | "plans" | "created_at" | "updated_at">
> & { plan_ids?: string[] };

// ── Audit Log ─────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  detail: string | null;
  created_at: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Service ───────────────────────────────────────────────────────────

export const adminService = {
  // Dashboard
  getDashboard: () => api.get<AdminDashboardStats>("/admin/dashboard"),

  // Users
  listUsers: (params?: { page?: number; per_page?: number; search?: string; status?: string; role?: string; tier?: string }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 20) });
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.role) qs.set("role", params.role);
    if (params?.tier) qs.set("tier", params.tier);
    return api.get<AdminUsersResponse>(`/admin/users?${qs}`);
  },

  getUser: (id: string) => api.get<AdminUser>(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: string, reason?: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/status`, { status, reason }),

  updateUserRoles: (id: string, roles: string[]) =>
    api.patch<AdminUser>(`/admin/users/${id}/roles`, { roles }),

  updateUserAiQuota: (id: string, quota_override: number | null, reason?: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/ai-quota`, { quota_override, reason }),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Payments
  listPayments: (params?: { page?: number; per_page?: number; status?: string; user_id?: string }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 20) });
    if (params?.status) qs.set("status", params.status);
    if (params?.user_id) qs.set("user_id", params.user_id);
    return api.get<AdminPaymentsResponse>(`/admin/payments?${qs}`);
  },

  getPayment: (id: string) => api.get<AdminPayment>(`/admin/payments/${id}`),

  approvePayment: (id: string, note?: string) =>
    api.post<AdminPayment>(`/admin/payments/${id}/approve`, { note }),

  rejectPayment: (id: string, reason: string) =>
    api.post<AdminPayment>(`/admin/payments/${id}/reject`, { reason }),

  // Direct <a href> link, not routed through api.ts — must include the
  // /app prefix ourselves since appPath() only runs inside api.request().
  getPaymentReceiptUrl: (id: string) => `/app/admin/payments/${id}/receipt`,

  // Plans
  listPlans: () => api.get<AdminPlansResponse>("/admin/plans"),

  createPlan: (data: Partial<AdminPlan>) => api.post<AdminPlan>("/admin/plans", data),

  updatePlan: (id: string, data: Partial<AdminPlan>) => api.put<AdminPlan>(`/admin/plans/${id}`, data),

  deletePlan: (id: string) => api.delete(`/admin/plans/${id}`),

  seedPlans: () => api.post<{ success: boolean; message: string }>("/admin/plans/seed", {}),

  // Cards
  listCards: () => api.get<AdminCardsResponse>("/admin/cards"),

  createCard: (data: Omit<AdminCard, "id">) => api.post<AdminCard>("/admin/cards", data),

  updateCard: (id: string, data: Partial<AdminCard>) => api.put<AdminCard>(`/admin/cards/${id}`, data),

  deleteCard: (id: string) => api.delete(`/admin/cards/${id}`),

  // Audit logs
  listLogs: (params?: { page?: number; per_page?: number; action?: string; target_type?: string }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 50) });
    if (params?.action) qs.set("action", params.action);
    if (params?.target_type) qs.set("target_type", params.target_type);
    return api.get<AuditLogsResponse>(`/admin/logs?${qs}`);
  },

  // ── Teacher package purchases (moderation queue) ─────────────────────
  listTeacherPurchases: (params?: { page?: number; per_page?: number; status?: string; user_id?: string }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 20) });
    if (params?.status) qs.set("status", params.status);
    if (params?.user_id) qs.set("user_id", params.user_id);
    return api.get<AdminTeacherPurchasesResponse>(`/admin/teacher-purchases?${qs}`);
  },

  approveTeacherPurchase: (id: string, note?: string) =>
    api.post<AdminTeacherPurchase>(`/admin/teacher-purchases/${id}/approve`, { note }),

  rejectTeacherPurchase: (id: string, reason: string) =>
    api.post<AdminTeacherPurchase>(`/admin/teacher-purchases/${id}/reject`, { reason }),

  // Same as getPaymentReceiptUrl above — direct link, needs /app itself.
  getTeacherPurchaseReceiptUrl: (id: string) => `/app/admin/teacher-purchases/${id}/receipt`,

  // ── Teacher package (admin editing) ──────────────────────────────────
  getTeacherPackage: () => api.get<AdminTeacherPackage>("/admin/teacher-package"),

  updateTeacherPackage: (data: AdminTeacherPackageUpdate) =>
    api.put<AdminTeacherPackage>("/admin/teacher-package", data),

  // ── Admin pricing plans ───────────────────────────────────────────────
  listPricingPlans: () => api.get<AdminPricingPlansResponse>("/admin/pricing"),

  updatePricingPlan: (id: string, data: AdminPricingPlanUpdate) =>
    api.put<AdminPricingPlan>(`/admin/pricing/${id}`, data),

  // ── Discounts ─────────────────────────────────────────────────────────
  listDiscounts: (params?: { page?: number; per_page?: number }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 20) });
    return api.get<AdminDiscountsResponse>(`/admin/discounts?${qs}`);
  },

  createDiscount: (data: AdminDiscountCreate) => api.post<AdminDiscount>("/admin/discounts", data),

  updateDiscount: (id: string, data: AdminDiscountUpdate) =>
    api.put<AdminDiscount>(`/admin/discounts/${id}`, data),

  deleteDiscount: (id: string) => api.delete(`/admin/discounts/${id}`),

  // ── Promo codes ───────────────────────────────────────────────────────
  listPromoCodes: (params?: { page?: number; per_page?: number }) => {
    const qs = new URLSearchParams({ page: String(params?.page ?? 1), per_page: String(params?.per_page ?? 20) });
    return api.get<AdminPromoCodesResponse>(`/admin/promo-codes?${qs}`);
  },

  createPromoCode: (data: AdminPromoCodeCreate) => api.post<AdminPromoCode>("/admin/promo-codes", data),

  updatePromoCode: (id: string, data: AdminPromoCodeUpdate) =>
    api.put<AdminPromoCode>(`/admin/promo-codes/${id}`, data),

  deletePromoCode: (id: string) => api.delete(`/admin/promo-codes/${id}`),
};