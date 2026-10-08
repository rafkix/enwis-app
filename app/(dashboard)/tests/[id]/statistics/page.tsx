"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { testService } from "@/services/test.service";
import { api, ApiError } from "@/lib/api";
import type { Test } from "@/lib/types";

interface TestStatsFull {
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  pass_rate: number;
  avg_time_seconds: number;
  score_distribution: Record<string, number>;
}

interface QuestionAnalysis {
  items: {
    question_id: string;
    question_text: string;
    correct_rate: number;
    discrimination_index: number;
    avg_time_seconds: number;
  }[];
}

function fmtTime(secs: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-slate)] w-14 shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-[var(--color-mist)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-deep)] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--color-ink)] w-6 text-right">{value}</span>
    </div>
  );
}

export default function TestStatisticsPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [stats, setStats] = useState<TestStatsFull | null>(null);
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [testData, statsData, analysisData] = await Promise.all([
          testService.get(id),
          api.get<TestStatsFull>(`/tests/${id}/statistics`),
          api.get<QuestionAnalysis>(`/tests/${id}/questions/analysis`),
        ]);
        setTest(testData);
        setStats(statsData);
        setAnalysis(analysisData);
      } catch (err) {
        if (err instanceof ApiError) setError(err.detail);
        else setError("Statistika yuklanmadi");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const distMax = stats
    ? Math.max(...Object.values(stats.score_distribution), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tests/${id}`}
          className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white hover:bg-[var(--color-mist)] transition-colors text-[var(--color-slate)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <h1 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-medium text-[var(--color-ink)]">
              {test?.title}
            </h1>
          )}
          <p className="text-sm text-[var(--color-slate)]">Statistika</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[var(--radius-xl)] bg-[var(--color-danger-light)] text-[var(--color-danger)]">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Jami urinish",
            value: loading ? null : stats?.total_attempts ?? 0,
            icon: Users,
            color: "text-[var(--color-deep)] bg-[var(--color-deep)]/10",
          },
          {
            label: "Yakunladi",
            value: loading ? null : stats?.completed_attempts ?? 0,
            icon: CheckCircle2,
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/15",
          },
          {
            label: "O'rtacha ball",
            value: loading ? null : `${stats?.average_score?.toFixed(1) ?? 0}%`,
            icon: BarChart3,
            color: "text-[var(--color-deep)] bg-[var(--color-volt)]/10",
          },
          {
            label: "O'rtacha vaqt",
            value: loading ? null : fmtTime(stats?.avg_time_seconds ?? 0),
            icon: Clock,
            color: "text-[var(--color-slate)] bg-[var(--color-mist)]",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)]"
          >
            <div className={`w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={18} />
            </div>
            {loading ? (
              <>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-[var(--color-ink)]">{card.value}</p>
                <p className="text-xs text-[var(--color-slate)] mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pass rate */}
      {!loading && stats && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-[var(--color-ink)]">Muvaffaqiyat darajasi</h2>
            <span className="text-2xl font-semibold text-[var(--color-ink)]">
              {stats.pass_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-[var(--color-mist)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-deep)] rounded-full transition-all duration-700"
              style={{ width: `${stats.pass_rate}%` }}
            />
          </div>
        </div>
      )}

      {/* Score distribution */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={18} className="text-[var(--color-slate)]" />
          <h2 className="font-medium text-[var(--color-ink)]">Ball taqsimoti</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : stats?.score_distribution ? (
          <div className="space-y-3">
            {Object.entries(stats.score_distribution).map(([range, count]) => (
              <ScoreBar key={range} label={range} value={count} max={distMax} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-slate)] text-center py-4">Ma&apos;lumot yo&apos;q</p>
        )}
      </div>

      {/* Question analysis */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--color-line)]">
          <TrendingUp size={18} className="text-[var(--color-slate)]" />
          <h2 className="font-medium text-[var(--color-ink)]">Savol tahlili</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !analysis?.items?.length ? (
          <div className="flex items-center justify-center py-12 text-[var(--color-slate)] text-sm">
            Hali tahlil uchun ma&apos;lumot yo&apos;q
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">
                    Savol
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">
                    To&apos;g&apos;ri %
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">
                    Qiyinlik
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">
                    Vaqt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {analysis.items.map((item, i) => {
                  const correctPct = Math.round(item.correct_rate * 100);
                  const difficulty =
                    correctPct >= 75 ? "Oson" : correctPct >= 45 ? "O'rta" : "Qiyin";
                  const diffVariant =
                    correctPct >= 75 ? "success" : correctPct >= 45 ? "warning" : "danger";
                  return (
                    <tr key={i} className="hover:bg-[var(--color-mist)]/50 transition-colors">
                      <td className="px-6 py-3.5 max-w-xs">
                        <p className="truncate text-[var(--color-ink)]">{item.question_text}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`font-medium ${
                            correctPct >= 75
                              ? "text-emerald-600"
                              : correctPct >= 45
                              ? "text-amber-600"
                              : "text-red-500"
                          }`}
                        >
                          {correctPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={diffVariant as "success" | "warning" | "danger"}>
                          {difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center text-[var(--color-slate)]">
                        {fmtTime(item.avg_time_seconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
