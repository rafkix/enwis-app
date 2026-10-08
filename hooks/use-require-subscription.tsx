"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/components/ui/toast";

/**
 * Gate for AI / premium-only actions (AI savol generatsiyasi va h.k.).
 *
 * Usage:
 *   const requireSubscription = useRequireSubscription();
 *   const onClick = () => {
 *     if (!requireSubscription()) return;
 *     setShowAiModal(true);
 *   };
 *
 * When the user has no active subscription this shows a toast asking
 * them to buy one (with a button that takes them to /billing) and
 * returns false so the caller can bail out *before* doing anything —
 * the button/action must not run at all, not run-then-fail.
 */
export function useRequireSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  return (message = "Bu funksiya faqat obuna egalari uchun mavjud"): boolean => {
    if (user?.has_active_subscription) return true;

    toast.warning(message, {
      duration: 6000,
      action: (
        <button
          onClick={() => router.push("/billing")}
          className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          Obuna sotib olish
        </button>
      ),
    });
    return false;
  };
}
