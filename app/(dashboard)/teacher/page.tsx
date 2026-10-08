"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  ListChecks,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  BookOpen,
  Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface TeacherDashboard {
  overview: {
    total_students: number;
    active_students: number;
    student_growth_30d: number;
    total_tests: number;
    total_exams: number;
    total_questions: number;
    test_attempts: number;
    exam_attempts: number;
    total_attempts: number;
    average_score: number;
    average_difficulty: number;
    completion_rate: number;
    success_rate: number;
    pass_count: number;
    fail_count: number;
    revenue: number;
  };
  recent_activity: {
    source: string;
    title: string;
    student_id: string;
    student_name: string;
    score_percentage: number;
    completed_at: string;
  }[];
  weekly: {
    period: string;
    attempts: number;
    new_students: number;
    average_score: number;
  }[];
  monthly: {
    period: string;
    attempts: number;
    new_students: number;
    average_score: number;
  }[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

function parseWeekLabel(period: string) {
  // "2025-W30" → "30-hafta"
  const match = period.match(/W(\d+)/);
  return match ? `${match[1]}-hafta` : period;
}

function parseMonthLabel(period: string) {
  const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const [, m] = period.split("-");
  return MONTHS[parseInt(m) - 1] || period;
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-end gap-0.5 h-8">
      <div
        className="w-full rounded-t-sm bg-[var(--color-deep)] opacity-70 transition-all"
        style={{ height: `${Math.max(pct, 4)}%` }}
      />
    </div>
  );
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    if (role !== "teacher" && role !== "admin") {
      router.replace("/");
      return;
    }
    (async () => {
      try {
        const res = await api.get<TeacherDashboard>("/dashboard/teacher");
        setData(res);
      } catch (err) {
        if (err instanceof ApiError) setError(err.detail);
        else setError("Statistika yuklanmadi");
      } finally {
        setLoading(false);
      }
    })();
  }, [role, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-slate)]">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const chartData = data ? (chartMode === "weekly" ? data.weekly : data.monthly) : [];
  const maxAttempts = Math.max(...chartData.map((d) => d.attempts), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
          O&apos;qituvchi paneli
        </h1>
        <p className="text-[var(--color-slate)] mt-1 text-sm">
          O&apos;quvchilar va testlar statistikasi
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Jami o'quvchilar",
            value: loading ? null : data?.overview.total_students ?? 0,
            sub: loading ? null : `${data?.overview.active_students ?? 0} faol`,
            icon: Users,
            color: "text-[var(--color-deep)] bg-[var(--color-deep)]/10",
            trend: data?.overview.student_growth_30d,
          },
          {
            label: "Jami urinishlar",
            value: loading ? null : data?.overview.total_attempts ?? 0,
            sub: loading ? null : `${data?.overview.completion_rate?.toFixed(1)}% yakunladi`,
            icon: ListChecks,
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/10",
          },
          {
            label: "O'rtacha ball",
            value: loading ? null : `${data?.overview.average_score?.toFixed(1)}%`,
            sub: loading ? null : `Muvaffaqiyat: ${data?.overview.success_rate?.toFixed(1)}%`,
            icon: Target,
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/15",
          },
          {
            label: "Jami testlar",
            value: loading ? null : data?.overview.total_tests ?? 0,
            sub: loading ? null : `${data?.overview.total_questions ?? 0} savol`,
            icon: BookOpen,
            color: "text-[var(--color-slate)] bg-[var(--color-mist)]",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
              {card.trend !== undefined && card.trend !== null && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${card.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  <ArrowUpRight size={12} className={card.trend < 0 ? "rotate-180" : ""} />
                  {Math.abs(card.trend)}
                </span>
              )}
            </div>
            {loading ? (
              <>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-[var(--color-ink)]">{card.value}</p>
                <p className="text-xs text-[var(--color-slate)] mt-0.5">{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pass/Fail stats */}
      {!loading && data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--color-ink)]">{data.overview.pass_count}</p>
              <p className="text-xs text-[var(--color-slate)]">O'tdi</p>
            </div>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--color-ink)]">{data.overview.fail_count}</p>
              <p className="text-xs text-[var(--color-slate)]">O'tmadi</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[var(--color-slate)]" />
            <h2 className="font-medium text-[var(--color-ink)]">Urinishlar trendi</h2>
          </div>
          <div className="flex gap-1 p-1 bg-[var(--color-mist)] rounded-[var(--radius-lg)]">
            {(["weekly", "monthly"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-md)] transition-all ${
                  chartMode === m
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-slate)] hover:text-[var(--color-ink)]"
                }`}
              >
                {m === "weekly" ? "Haftalik" : "Oylik"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-end gap-2 h-32">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-16 rounded" />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-slate)] text-sm">
            Ma&apos;lumot yo&apos;q
          </div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--color-slate)]">{d.attempts}</span>
                <MiniBar value={d.attempts} max={maxAttempts} />
                <span className="text-[10px] text-[var(--color-slate-light)] truncate w-full text-center">
                  {chartMode === "weekly" ? parseWeekLabel(d.period) : parseMonthLabel(d.period)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--color-line)]">
          <TrendingUp size={18} className="text-[var(--color-slate)]" />
          <h2 className="font-medium text-[var(--color-ink)]">So&apos;nggi faollik</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : !data?.recent_activity?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-slate)]">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Hali hech kim testlaringizni ishlamagan</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {data.recent_activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center text-sm font-semibold text-[var(--color-deep)] shrink-0">
                  {item.student_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                    {item.student_name}
                  </p>
                  <p className="text-xs text-[var(--color-slate)] truncate">
                    {item.title}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant={item.score_percentage >= 60 ? "success" : "danger"}
                  >
                    {item.score_percentage.toFixed(0)}%
                  </Badge>
                  <span className="text-[10px] text-[var(--color-slate-light)] flex items-center gap-1">
                    <Clock size={10} />
                    {timeAgo(item.completed_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
