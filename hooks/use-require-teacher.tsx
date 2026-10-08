"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/components/ui/toast";

export function useRequireTeacher() {
  const router = useRouter();
  const { toast } = useToast();
  const role = useAuthStore((s) => s.role);

  return (message = "Bu funksiya faqat o'qituvchilar uchun mavjud"): boolean => {
    if (role === "teacher" || role === "admin") return true;

    toast.warning(message, {
      duration: 6000,
      action: (
        <button
          onClick={() => router.push("/billing")}
          className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          O'qituvchi bo'lish
        </button>
      ),
    });
    return false;
  };
}
