import { api, ApiError, API_BASE } from "@/lib/api";
import type {
  BillingPricingPlan,
  PaymentCardListResponse,
  Payment,
  PaymentListResponse,
  InitiatePaymentRequest,
  BillingCheckoutInfo,
  PromoCodeValidateResponse,
  TeacherPackage,
  TeacherPurchase,
  ApiResponse,
} from "@/lib/types";

// ─── Response wrappers ────────────────────────────────────────────────
// GET /billing/pricing returns { items, total } — NOT wrapped in `data`.
interface PricingPlansResponse {
  items: BillingPricingPlan[];
  total: number;
}

// Backend: app/modules/subscriptions/{billing_router,schemas}.py
// Flow: initiate() -> show the returned card to the user -> uploadReceipt()
// -> payment moves to "waiting_for_review" -> admin approves/rejects ->
// subscription is activated automatically on approval.
export const billingService = {
  // ── Teacher Package ─────────────────────────────────────────────
  // GET /billing/teacher-package returns ApiResponse wrapping { available, id, … }
  getTeacherPackage: () =>
    api.get<ApiResponse<TeacherPackage>>("/billing/teacher-package"),

  // Step 1 of teacher-package purchase: creates a pending purchase.
  // TEACHER role is NOT granted here — only after receipt upload + admin
  // approval. Response shape is untyped in openapi so we return `unknown`
  // and normalise on the call site (see billing/page.tsx normalizeTeacherPurchase).
  purchaseTeacherPackage: (payment_method = "manual_card", payment_ref?: string) =>
    api.post<unknown>(
      "/billing/teacher-package/purchase",
      { payment_method, payment_ref },
    ),

  // ── Pricing Plans ───────────────────────────────────────────────
  // FIX: Backend returns { items: BillingPricingPlan[], total: number }
  // NOT { data: BillingPricingPlan[] }. Previous type caused billingPlans
  // to always be [] because billing/page.tsx was doing `.data ?? []`.
  getPricingPlans: () =>
    api.get<PricingPlansResponse>("/billing/pricing"),

  // ── Promo Code ──────────────────────────────────────────────────
  // FIX: Backend returns PromoCodeValidateResponse directly (raw object),
  // NOT wrapped in { data: ... }. Previous type caused promo validation
  // to always silently fail because callers were accessing .data.valid.
  validatePromoCode: (code: string) =>
    api.post<PromoCodeValidateResponse>("/billing/promo/validate", { code }),

  // Cards currently accepted for manual transfer.
  listCards: () => api.get<PaymentCardListResponse>("/payment-cards"),

  // Step 1: create a PENDING payment for a plan, get back which card to pay to.
  initiate: (payload: InitiatePaymentRequest) =>
    api.post<BillingCheckoutInfo>("/payments", payload),

  // My transaction history.
  listPayments: (page = 1, perPage = 20) =>
    api.get<PaymentListResponse>(
      `/payments?page=${page}&per_page=${perPage}`,
    ),

  getPayment: (paymentId: string) =>
    api.get<Payment>(`/payments/${paymentId}`),

  cancelPayment: (paymentId: string) =>
    api.post<Payment>(`/payments/${paymentId}/cancel`),

  // My own uploaded receipt file (to review what I sent).
  getReceiptBlob: (paymentId: string) =>
    api.getBlob(`/payments/${paymentId}/receipt`),

  // ── Teacher package purchase lifecycle ────────────────────────────
  cancelTeacherPurchase: (purchaseId: string) =>
    api.post<TeacherPurchase>(`/billing/teacher-package/purchases/${purchaseId}/cancel`),

  uploadTeacherPurchaseReceipt: (purchaseId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.postUpload<TeacherPurchase>(
      `/billing/teacher-package/purchases/${purchaseId}/receipt`,
      fd,
    );
  },

  // Step 2: upload the transfer screenshot/PDF (JPEG/PNG/WebP/PDF, max 5MB).
  // Uses XHR instead of the fetch-based `api` client so we can report real
  // upload progress via onProgress(0-100) — useful for slow connections.
  uploadReceipt: (
    paymentId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<Payment> => {
    const send = (): Promise<Payment> =>
      new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${API_BASE}/app/payments/${paymentId}/receipt`,
          true,
        );
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          let data: unknown = null;
          try {
            data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          } catch {
            data = null;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as Payment);
          } else if (xhr.status === 401) {
            reject(new ApiError(401, "unauthorized"));
          } else {
            const detail =
              (data as { error?: { detail?: string }; message?: string })
                ?.error?.detail ||
              (data as { message?: string })?.message ||
              xhr.statusText ||
              "Chekni yuklashda xatolik yuz berdi";
            reject(new ApiError(xhr.status, detail));
          }
        };

        xhr.onerror = () =>
          reject(new ApiError(0, "Tarmoq xatosi. Internetni tekshiring."));

        xhr.send(formData);
      });

    // If the access-token cookie expired mid-session, refresh once via the
    // same cookie-refresh endpoint the fetch client uses, then retry.
    return send().catch(async (err) => {
      if (err instanceof ApiError && err.status === 401) {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (res.ok) return send();
      }
      throw err;
    });
  },
};
