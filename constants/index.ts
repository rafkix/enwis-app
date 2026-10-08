import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ListChecks, Gauge, User, CreditCard, Bell, TrendingUp } from "lucide-react";
import type { UserRole } from "@/stores/auth";

export const API_PREFIX = "/api/v1";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// Shared between the desktop Sidebar (drawer + rail) and the Telegram
// Mini App BottomNav — one source of truth so the two never drift apart.
export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/", label: "Boshqaruv paneli", icon: LayoutDashboard, roles: ["user", "teacher", "admin"] },
  { href: "/tests", label: "Testlar", icon: ListChecks, roles: ["user", "teacher", "admin"] },
  { href: "/questions", label: "Savollarim (Rasch)", icon: Gauge, roles: ["teacher", "admin"] },
  { href: "/teacher", label: "O'qituvchi paneli", icon: TrendingUp, roles: ["teacher", "admin"] },
  { href: "/notifications", label: "Bildirishnomalar", icon: Bell, roles: ["user", "teacher", "admin"] },
  { href: "/profile", label: "Profil", icon: User, roles: ["user", "teacher", "admin"] },
  { href: "/billing", label: "Obuna / Tarif", icon: CreditCard, roles: ["user", "teacher", "admin"] },
];

export const ROLES = {
  USER: "USER",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
} as const;

export const EXAM_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export const TEST_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "single_choice",
  SHORT_ANSWER: "short_answer",
  IMAGE: "image",
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export const VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public",
} as const;

export const QUESTION_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
