"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { testService } from "@/services/test.service";
import type { ApiResponse, DashboardStats, TestList } from "@/lib/types";
import {
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  ListChecks,
  Sparkles,
  CheckCircle2,
  Award,
} from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/stores/auth";

const EASE = [0.16, 1, 0.3, 1] as const;

const QUICK_ACTIONS: {
  label: string;
  href: string;
  icon: typeof ListChecks;
  color: string;
  roles: UserRole[];
}[] = [
  {
    label: "Yangi test yaratish",
    href: "/tests/create",
    icon: ListChecks,
    color: "bg-[var(--color-volt)] text-[var(--color-deep-900)]",
    roles: ["user", "teacher", "admin"],
  },
  {
    label: "Testlarimni ko'rish",
    href: "/tests",
    icon: FileText,
    color:
      "bg-[var(--color-mist)] text-[var(--color-deep)] border border-[var(--color-line)]",
    roles: ["user", "teacher", "admin"],
  },
  {
    label: "Obuna / Tarif",
    href: "/billing",
    icon: Sparkles,
    color:
      "bg-[var(--color-volt-dim)] text-[var(--color-deep-900)] border border-[var(--color-line)]",
    roles: ["user", "teacher", "admin"],
  },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  const weeks = Math.floor(days / 7);
  return `${weeks} hafta oldin`;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Qoralama",
  active: "Faol",
  archived: "Arxiv",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTests, setRecentTests] = useState<TestList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, testsRes] = await Promise.allSettled([
          api.get<ApiResponse<DashboardStats>>("/dashboard/stats"),
          testService.list({ page: 1, limit: 5 }),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data);
        } else {
          setError(
            statsRes.reason instanceof ApiError
              ? statsRes.reason.detail
              : "Statistikani yuklab bo'lmadi",
          );
        }

        setRecentTests(
          testsRes.status === "fulfilled" ? testsRes.value.items : [],
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const isTeacher = role === "teacher" || role === "admin";

  const statCards = stats
    ? [
        {
          label: "Jami testlar",
          value: String(stats.tests.total),
          change: "Barcha testlar",
          icon: ListChecks,
        },
        {
          label: "Qoralama testlar",
          value: String(stats.tests.draft),
          change: "Hali nashr etilmagan",
          icon: FileText,
        },
        {
          label: "Faol testlar",
          value: String(stats.tests.active),
          change: "Nashr etilgan",
          icon: CheckCircle2,
        },
        {
          label: "Urinishlar",
          value: String(stats.attempts.total_attempts),
          change: `O'rtacha ${Math.round(stats.attempts.average_percentage)}%`,
          icon: TrendingUp,
        },
        ...(isTeacher
          ? [
              {
                label: "Sertifikatlar",
                value: String(stats.certificates.total),
                change: "Berilgan",
                icon: Award,
              },
            ]
          : []),
      ]
    : [];

  const firstName = user?.full_name?.split(" ")[0] || "Foydalanuvchi";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[clamp(1.25rem,2.5vw,1.75rem)] font-medium leading-tight text-[var(--color-ink)]">
            Salom, {firstName} 👋
          </p>
          <p className="text-sm text-[var(--color-slate)] mt-1">
            Boshqaruv panelingiz — bugungi holat va tez harakatlar
          </p>
        </div>
        <Link
          href="/tests/create"
          className="hidden sm:flex items-center gap-1.5 rounded-full bg-[var(--color-volt)] px-4 py-2.5 text-sm font-medium text-[var(--color-deep-900)] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Yangi test
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[110px] rounded-xl border border-[var(--color-line)] bg-white animate-pulse"
              />
            ))
          : statCards.length === 0
            ? (
                <div className="col-span-full rounded-xl border border-[var(--color-line)] bg-white p-8 text-center text-sm text-[var(--color-slate)]">
                  Birinchi testingizni yarating va statistikangizni shu yerda ko&apos;ring.
                </div>
              )
            : statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="rounded-xl border border-[var(--color-line)] bg-white p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-mist)]">
                    <stat.icon
                      className="h-4 w-4 text-[var(--color-deep)]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <p className="font-display text-2xl font-medium text-[var(--color-ink)]">
                    {stat.value}
                  </p>
                  <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
                    {stat.label}
                  </p>
                  <p className="text-xs text-[var(--color-slate-light)] mt-0.5">
                    {stat.change}
                  </p>
                </motion.div>
              ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-base font-medium text-[var(--color-ink)]">
            Tez harakatlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.filter((action) => action.roles.includes(role)).map(
              (action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                >
                  <Link
                    href={action.href}
                    className={`flex items-center gap-3 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-sm)] ${action.color}`}
                  >
                    <action.icon size={18} strokeWidth={1.75} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                </motion.div>
              ),
            )}
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 mt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-mist)]">
                <Sparkles
                  size={16}
                  className="text-[var(--color-deep)]"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <p className="font-display text-sm font-medium text-[var(--color-ink)]">
                  Maslahatlar
                </p>
                <p className="text-xs text-[var(--color-slate)]">
                  Tez harakatlar va maslahatlar
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: "Test yarating",
                  desc: "Savollarni tizimlang",
                  href: "/tests/create",
                  cta: "Boshlash",
                },
                {
                  title: "AI bilan savol yarating",
                  desc: "Vaqtingizni tejang",
                  href: "/tests",
                  cta: "Ko'rish",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-lg bg-[var(--color-mist)] border border-[var(--color-line)] p-3.5"
                >
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {tip.title}
                  </p>
                  <p className="text-xs text-[var(--color-slate)] mt-1">
                    {tip.desc}
                  </p>
                  <Link
                    href={tip.href}
                    className="text-xs text-[var(--color-deep)] mt-2 inline-block hover:underline"
                  >
                    {tip.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-medium text-[var(--color-ink)]">
              So&apos;nggi testlar
            </h2>
            <Link
              href="/tests"
              className="text-xs text-[var(--color-deep)] hover:text-[var(--color-deep-800)] flex items-center gap-1"
            >
              Hammasi <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 h-[64px] animate-pulse bg-[var(--color-mist)]"
                />
              ))
            ) : recentTests.length > 0 ? (
              recentTests.map((test, i) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.15 + i * 0.08,
                    ease: EASE,
                  }}
                >
                  <Link
                    href={`/tests/${test.id}`}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-[var(--color-mist)]/60"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                      <Zap
                        size={14}
                        className="text-[var(--color-deep)]"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--color-ink-soft)] leading-snug truncate">
                        {test.title}
                      </p>
                      <p className="text-xs text-[var(--color-slate-light)] mt-0.5">
                        {STATUS_LABEL[test.status] ?? test.status} ·{" "}
                        {timeAgo(test.created_at)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-sm text-[var(--color-slate)]">
                Hozircha test yo&apos;q
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
