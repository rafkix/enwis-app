"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CreditCard,
  ListChecks,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Award,
  GraduationCap,
  Percent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { adminService, type AdminDashboardStats } from "@/services/admin.service";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "admin") { router.replace("/"); return; }
    adminService.getDashboard().then(setStats).finally(() => setLoading(false));
  }, [role, router]);

  const pendingCount = (stats?.payments.combined_waiting_for_review ?? 0);
  const teacherPendingCount = (stats?.payments.teacher_purchases.waiting_for_review ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Admin paneli
          </h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">Umumiy statistika va boshqaruv</p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--color-deep)]" />
          <Badge variant="info">Admin</Badge>
        </div>
      </div>

      {/* Pending alert */}
      {!loading && pendingCount > 0 && (
        <Link
          href="/admin/payments"
          className="flex items-center gap-3 p-4 rounded-[var(--radius-xl)] bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm font-medium flex-1">
            Ko&apos;rib chiqilishi kerak: <span className="font-bold">{pendingCount}</span> ta to&apos;lov kutmoqda
          </p>
          <ArrowRight size={16} />
        </Link>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Foydalanuvchilar",
            value: stats?.users.total,
            sub: `+${stats?.users.new_today ?? 0} bugun`,
            icon: Users,
            href: "/admin/users",
            color: "text-[var(--color-deep)] bg-[var(--color-deep)]/10",
          },
          {
            label: "Faol obunalar",
            value: stats?.subscriptions.active,
            sub: `${stats?.subscriptions.by_tier?.PRO ?? 0} PRO · ${stats?.subscriptions.by_tier?.PREMIUM ?? 0} Premium`,
            icon: CreditCard,
            href: "/admin/payments",
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/10",
          },
          {
            label: "Jami testlar",
            value: stats?.content.total_tests,
            sub: `${stats?.content.total_questions ?? 0} savol`,
            icon: ListChecks,
            href: undefined,
            color: "text-[var(--color-slate)] bg-[var(--color-mist)]",
          },
          {
            label: "Urinishlar",
            value: stats?.content.total_attempts,
            sub: `${stats?.content.total_certificates ?? 0} sertifikat`,
            icon: BarChart3,
            href: undefined,
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/15",
          },
        ].map((card, i) => {
          const inner = (
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-soft-md)] transition-shadow">
              <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon size={18} />
              </div>
              {loading ? (
                <>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-[var(--color-ink)]">
                    {card.value?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-xs text-[var(--color-slate)] mt-0.5">{card.sub}</p>
                </>
              )}
            </div>
          );
          return card.href ? (
            <Link key={i} href={card.href}>{inner}</Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>

      {/* Revenue + By tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[var(--color-slate)]" />
            <h2 className="font-medium text-[var(--color-ink)]">Daromad</h2>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <>
              <p className="text-3xl font-semibold text-[var(--color-ink)]">
                {fmtMoney(stats?.payments.combined_revenue ?? 0)}
                <span className="text-base font-normal text-[var(--color-slate)] ml-1">so&apos;m</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--color-slate)]">
                <div>
                  <p className="font-medium text-[var(--color-ink)] text-sm">
                    {fmtMoney(stats?.payments.total_revenue ?? 0)} so&apos;m
                  </p>
                  <p>Obuna to&apos;lovlari</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-ink)] text-sm">
                    {fmtMoney(stats?.payments.teacher_purchases.revenue ?? 0)} so&apos;m
                  </p>
                  <p>O&apos;qituvchi paketi</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Subscription tiers */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-[var(--color-slate)]" />
            <h2 className="font-medium text-[var(--color-ink)]">Obuna taqsimoti</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats?.subscriptions.by_tier ?? {}).map(([tier, count]) => {
                const total = Object.values(stats?.subscriptions.by_tier ?? {}).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = {
                  FREE: "bg-[var(--color-mist)] text-[var(--color-slate)]",
                  PRO: "bg-[var(--color-deep)]/10 text-[var(--color-deep)]",
                  PREMIUM: "bg-[var(--color-volt)]/20 text-[var(--color-deep)]",
                  TEACHER: "bg-[var(--color-deep)] text-white",
                };
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-20 text-center ${colors[tier] ?? "bg-[var(--color-mist)] text-[var(--color-slate)]"}`}>
                      {tier}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--color-mist)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-deep)] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-slate)] w-12 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Foydalanuvchilar", href: "/admin/users", icon: Users },
          { label: "To'lovlar", href: "/admin/payments", icon: CreditCard, badge: pendingCount },
          { label: "O'qituvchi xaridlari", href: "/admin/teacher-purchases", icon: GraduationCap, badge: teacherPendingCount },
          { label: "Narxlar / Promo", href: "/admin/pricing", icon: Percent },
          { label: "Rejalar", href: "/admin/plans", icon: BookOpen },
          { label: "Kartalar", href: "/admin/cards", icon: CreditCard },
          { label: "Audit log", href: "/admin/logs", icon: BarChart3 },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-2 p-4 rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white hover:bg-[var(--color-mist)] hover:shadow-[var(--shadow-soft-sm)] transition-all text-center"
          >
            {item.badge ? (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
            <item.icon size={20} className="text-[var(--color-deep)]" />
            <span className="text-xs font-medium text-[var(--color-ink)]">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
