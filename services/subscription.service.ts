import { api } from "@/lib/api";
import type {
  SubscriptionPlan,
  MySubscriptionResponse,
  SubscriptionHistoryResponse,
} from "@/lib/types";

// NOTE: Plan create/update/delete/seed moved to the ADMIN-only
// /admin/plans/* endpoints (see app/modules/admin on the backend).
// This service is now the read-only, user-facing surface plus the
// free-plan direct-subscribe shortcut. Paid plans go through
// billing.service.ts (POST /billing/payments -> upload receipt ->
// wait for admin review) instead of subscribe() below.
export const subscriptionService = {
  // ── Plans (read-only for everyone) ──────────────────────────────
  plans: (activeOnly?: boolean) => {
    const qs = activeOnly ? "?active_only=true" : "";
    return api.get<{ items: SubscriptionPlan[]; total: number }>(
      `/subscriptions/plans${qs}`,
    );
  },

  getPlan: (planId: string) =>
    api.get<SubscriptionPlan>(`/subscriptions/plans/${planId}`),

  // ── My subscription ─────────────────────────────────────────────
  // Only works for free (price === 0) plans. Paid plans must go
  // through billingService.initiate() instead — the backend rejects
  // this call with a 400 if the plan isn't free.
  subscribeFree: (planId: string) =>
    api.post<{ active: boolean; [key: string]: unknown }>(
      "/subscriptions/subscribe",
      { plan_id: planId },
    ),

  cancel: (subscriptionId: string) =>
    api.post(`/subscriptions/${subscriptionId}/cancel`),

  me: () => api.get<MySubscriptionResponse>("/subscriptions/me"),

  myHistory: () =>
    api.get<SubscriptionHistoryResponse>("/subscriptions/me/history"),
};
