"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gauge,
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Modal,
  ModalOverlay,
  ModalPanel,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { testService } from "@/services/test.service";
import { useRequireTeacher } from "@/hooks/use-require-teacher";
import type {
  TestList,
  TestQuestion,
  RaschCalibrateResponse,
  RaschGenerateTestResponse,
} from "@/lib/types";

// Flat, aggregated row: a TestQuestion plus which Test it lives in. There
// is no server-side "all my questions" endpoint — questions only exist
// nested under /tests/{id}/questions — so this page fetches every test the
// teacher owns and merges their question lists client-side. Fine at the
// scale a single teacher's question bank runs at; would need a real
// backend aggregate endpoint if that assumption stops holding.
interface QuestionRow extends TestQuestion {
  test_title: string;
  test_status: string;
}

const IRT_TOOLTIP =
  "Bu qiymat real o'quvchilar javoblaridan hisoblangan haqiqiy qiyinlik darajasi (an'anaviy Oson/O'rta/Qiyin belgisidan farqli, statistik hisoblangan).";

function irtLevel(b: number): { label: string; variant: "success" | "warning" | "danger" } {
  if (b < -0.5) return { label: "Oson", variant: "success" };
  if (b > 0.5) return { label: "Qiyin", variant: "danger" };
  return { label: "O'rta", variant: "warning" };
}

function IrtBadge({ b }: { b: number | null | undefined }) {
  if (b === null || b === undefined) {
    return (
      <Badge variant="default" title={IRT_TOOLTIP}>
        Kalibrlanmagan
      </Badge>
    );
  }
  const { label, variant } = irtLevel(b);
  return (
    <Badge variant={variant} title={IRT_TOOLTIP}>
      {label} · {b.toFixed(2)}
    </Badge>
  );
}

// Small hand-rolled SVG line chart for the information_curve — no chart
// library is installed in this app (checked package.json), and adding one
// for a single line chart isn't worth the dependency.
function InformationCurveChart({ points }: { points: { theta: number; information: number }[] }) {
  if (!points.length) return null;
  const width = 520;
  const height = 200;
  const pad = 36;
  const thetas = points.map((p) => p.theta);
  const infos = points.map((p) => p.information);
  const minX = Math.min(...thetas);
  const maxX = Math.max(...thetas);
  const maxY = Math.max(...infos, 0.001);
  const xs = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const ys = (y: number) => height - pad - (y / maxY) * (height - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(p.theta).toFixed(1)} ${ys(p.information).toFixed(1)}`).join(" ");
  const peak = points.reduce((a, b) => (b.information > a.information ? b : a), points[0]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--color-line)" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--color-line)" strokeWidth={1} />
      <path d={path} fill="none" stroke="var(--color-deep)" strokeWidth={2.5} />
      <circle cx={xs(peak.theta)} cy={ys(peak.information)} r={4} fill="var(--color-volt)" stroke="var(--color-deep)" strokeWidth={1.5} />
      <text x={pad} y={height - 10} fontSize={11} fill="var(--color-slate)">{minX.toFixed(1)}</text>
      <text x={width - pad} y={height - 10} fontSize={11} fill="var(--color-slate)" textAnchor="end">{maxX.toFixed(1)}</text>
      <text x={width / 2} y={height - 10} fontSize={11} fill="var(--color-slate)" textAnchor="middle">qiyinlik darajasi</text>
      <text x={pad - 8} y={pad} fontSize={11} fill="var(--color-slate)" textAnchor="end">aniqlik</text>
    </svg>
  );
}

function QuestionsPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const requireTeacher = useRequireTeacher();

  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestList[]>([]);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  // Session-only overlay: results from the last calibrate() call, keyed by
  // question id. Needed because GET /tests/{id}/questions does not (yet)
  // return irt_b — see the note on TestQuestion in lib/types.ts. Once the
  // backend adds the field, `rows` will already carry it and this overlay
  // becomes a no-op (still harmless to keep as a fallback).
  const [irtOverrides, setIrtOverrides] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [testFilter, setTestFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [calibrating, setCalibrating] = useState(false);
  const [calibrateResult, setCalibrateResult] = useState<RaschCalibrateResponse | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wTitle, setWTitle] = useState("");
  const [wDescription, setWDescription] = useState("");
  const [wTheta, setWTheta] = useState(0);
  const [wCount, setWCount] = useState(20);
  const [wRequireCalibrated, setWRequireCalibrated] = useState(true);
  const [wMinGap, setWMinGap] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<RaschGenerateTestResponse | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      let page = 1;
      let allTests: TestList[] = [];
      // testService.list is paginated (server default 20/page); walk every
      // page since this view needs the teacher's *entire* question set.
      while (true) {
        const res = await testService.list({ page, limit: 100 });
        allTests = allTests.concat(res.items);
        if (page >= res.pages || res.items.length === 0) break;
        page++;
      }
      setTests(allTests);

      const perTest = await Promise.all(
        allTests.map((t) =>
          testService.questions
            .list(t.id)
            .then((qs) => qs.map((q) => ({ ...q, test_title: t.title, test_status: t.status })))
            .catch(() => [] as QuestionRow[])
        )
      );
      setRows(perTest.flat());
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Savollarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!requireTeacher()) {
      router.replace("/");
      return;
    }
    // One-time data load on mount, same pattern as the other dashboard pages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (testFilter !== "all" && r.test_id !== testFilter) return false;
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [rows, testFilter, search]);

  const allFilteredSelected = filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filteredRows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runCalibrate(questionIds: string[] | null) {
    setCalibrating(true);
    try {
      const res = await testService.rasch.calibrate({ question_ids: questionIds });
      setCalibrateResult(res);
      setIrtOverrides((prev) => {
        const next = { ...prev };
        res.items.forEach((it) => {
          next[it.question_id] = it.irt_b;
        });
        return next;
      });
      toast.success(`${res.calibrated} ta savol kalibrlandi${res.skipped ? `, ${res.skipped} tasi o'tkazib yuborildi` : ""}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.detail : "Kalibrlashda xatolik yuz berdi");
    } finally {
      setCalibrating(false);
    }
  }

  async function handleCalibrateSelected() {
    if (selected.size === 0) return;
    await runCalibrate(Array.from(selected));
  }

  async function handleCalibrateAll() {
    const confirmed = await showConfirm({
      title: "Barcha savollarni kalibrlash",
      description: `Bu sizning barcha testlaringizdagi (${rows.length} ta) savolni Rasch modeli bo'yicha qayta hisoblaydi. Davom etasizmi?`,
      variant: "confirm",
    });
    if (!confirmed) return;
    await runCalibrate(null);
  }

  function openWizard() {
    setWTitle("");
    setWDescription("");
    setWTheta(0);
    setWCount(20);
    setWRequireCalibrated(true);
    setWMinGap(0);
    setGenerateError(null);
    setGenerateResult(null);
    setWizardStep(0);
    setShowWizard(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await testService.rasch.generate({
        title: wTitle.trim(),
        description: wDescription.trim() || undefined,
        target_theta: wTheta,
        num_questions: wCount,
        require_calibrated: wRequireCalibrated,
        min_gap: wMinGap,
      });
      setGenerateResult(res);
      setWizardStep(2);
      toast.success("Test yaratildi (qoralama holatda)");
    } catch (e) {
      if (e instanceof ApiError) {
        setGenerateError(e.detail);
      } else {
        toast.error("Kutilmagan xatolik yuz berdi");
      }
    } finally {
      setGenerating(false);
    }
  }

  const calibratedCount = rows.filter((r) => irtOverrides[r.id] !== undefined || r.irt_b !== null && r.irt_b !== undefined).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <Gauge size={22} className="text-[var(--color-deep)]" />
            Savollarim (Rasch)
          </h1>
          <p className="text-sm text-[var(--color-slate)] mt-1">
            {"Barcha testlaringizdagi savollarni bir joydan ko'ring, real qiyinlik darajasi bo'yicha kalibrlang va shu asosda yangi test tuzing."}
          </p>
        </div>
        <Button onClick={openWizard} className="shrink-0">
          <Sparkles className="h-4 w-4" />
          Rasch test yaratish
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-slate-light)]" />
          <Input placeholder="Savol matni bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="sm:w-64">
          <option value="all">Barcha testlar</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCalibrateSelected}
          disabled={selected.size === 0 || calibrating}
        >
          {calibrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          Tanlanganlarni kalibrlash ({selected.size})
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCalibrateAll} disabled={calibrating || rows.length === 0}>
          Barchasini kalibrlash
        </Button>
        <span className="text-xs text-[var(--color-slate)] ml-auto">
          {calibratedCount} / {rows.length} ta savol kalibrlangan
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-16 text-sm text-[var(--color-slate)]">
          {rows.length === 0 ? "Hali savollaringiz yo'q. Avval testga savol qo'shing." : "Filtrga mos savol topilmadi."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="accent-[var(--color-deep)] h-4 w-4" />
              </TableHead>
              <TableHead>Savol</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Rasch qiyinlik</TableHead>
              <TableHead className="text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((r) => {
              const b = irtOverrides[r.id] ?? r.irt_b ?? null;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      className="accent-[var(--color-deep)] h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-[var(--color-ink)]">{r.title}</p>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tests/${r.test_id}/questions`}
                      className="text-[var(--color-deep)] hover:underline inline-flex items-center gap-1"
                    >
                      {r.test_title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <IrtBadge b={b} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => runCalibrate([r.id])} disabled={calibrating}>
                      Kalibrlash
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Calibration result modal */}
      <Modal open={!!calibrateResult} onClose={() => setCalibrateResult(null)}>
        <ModalOverlay>
          <ModalPanel size="sm">
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Gauge size={18} />
                Kalibrlash natijasi
              </div>
            </ModalHeader>
            <ModalBody>
              {calibrateResult && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">Kalibrlandi</p>
                      <p className="text-lg font-semibold text-[var(--color-ink)]">{calibrateResult.calibrated}</p>
                    </div>
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">{"O'tkazib yuborildi"}</p>
                      <p className="text-lg font-semibold text-[var(--color-ink)]">{calibrateResult.skipped}</p>
                    </div>
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">{"Javoblar / o'quvchilar"}</p>
                      <p className="text-lg font-semibold text-[var(--color-ink)]">
                        {calibrateResult.n_responses} / {calibrateResult.n_persons}
                      </p>
                    </div>
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">Konvergensiya</p>
                      <p className="text-lg font-semibold flex items-center gap-1.5">
                        {calibrateResult.converged ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-700">Ha</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-700">{"Yo'q"}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {calibrateResult.skipped > 0 && (
                    <p className="text-xs text-[var(--color-slate)]">
                      {"O'tkazib yuborilgan savollar — hali hech kim yechmagan yoki barcha o'quvchilar bir xil javob bergan savollar bo'lishi mumkin."}
                    </p>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setCalibrateResult(null)}>Yopish</Button>
            </ModalFooter>
          </ModalPanel>
        </ModalOverlay>
      </Modal>

      {/* Rasch test generation wizard */}
      <Modal open={showWizard} onClose={() => setShowWizard(false)}>
        <ModalOverlay>
          <ModalPanel size="lg">
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                {"Rasch bo'yicha test yaratish"}
              </div>
            </ModalHeader>
            <ModalBody>
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Test nomi *</Label>
                    <Input value={wTitle} onChange={(e) => setWTitle(e.target.value)} placeholder="Masalan: Matematika — o'rtacha daraja" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Tavsif</Label>
                    <Input value={wDescription} onChange={(e) => setWDescription(e.target.value)} placeholder="Ixtiyoriy" />
                  </div>
                  <p className="text-xs text-[var(--color-slate)]">
                    {"Savollar banki va kategoriya bo'yicha filtrlash hozircha mavjud emas — bu funksiya kalibrlangan savollarning barchasi orasidan tanlaydi."}
                  </p>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-medium">Maqsadli qiyinlik darajasi</Label>
                      <span className="text-sm font-semibold text-[var(--color-deep)]">{wTheta.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      step={0.1}
                      value={wTheta}
                      onChange={(e) => setWTheta(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-deep)]"
                    />
                    <div className="flex justify-between text-[11px] text-[var(--color-slate-light)] mt-1">
                      <span>{"Past (kuchsizroq o'quvchilar uchun)"}</span>
                      <span>{"O'rtacha"}</span>
                      <span>{"Yuqori (kuchli o'quvchilar uchun)"}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Savollar soni</Label>
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={wCount}
                      onChange={(e) => setWCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                    <input
                      type="checkbox"
                      checked={wRequireCalibrated}
                      onChange={(e) => setWRequireCalibrated(e.target.checked)}
                      className="accent-[var(--color-deep)] h-4 w-4"
                    />
                    Faqat kalibrlangan savollardan tanlansin
                  </label>
                  {!wRequireCalibrated && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] p-2">
                      {"Kalibrlanmagan savollar ham ishlatilishi mumkin — ularning qiyinligi taxminiy bo'ladi."}
                    </p>
                  )}
                  {generateError && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-[var(--color-danger-light)] border border-red-200 rounded-[var(--radius-lg)] p-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p>{generateError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWizard(false);
                            handleCalibrateAll();
                          }}
                          className="text-xs font-semibold underline underline-offset-2 mt-1"
                        >
                          Avval savollarni kalibrlash
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 2 && generateResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-lg)] p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>{generateResult.test.title}</strong> nomli test qoralama holatda yaratildi ({generateResult.selected_question_ids.length} ta savol).
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">Maqsadli daraja</p>
                      <p className="font-semibold">{generateResult.target_theta.toFixed(1)}</p>
                    </div>
                    <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-mist)]">
                      <p className="text-xs text-[var(--color-slate)]">{"Qiyinlik oralig'i"}</p>
                      <p className="font-semibold">
                        {typeof generateResult.difficulty_spread.min_b === "number" ? generateResult.difficulty_spread.min_b.toFixed(2) : "—"}
                        {" … "}
                        {typeof generateResult.difficulty_spread.max_b === "number" ? generateResult.difficulty_spread.max_b.toFixed(2) : "—"}
                      </p>
                    </div>
                  </div>
                  {generateResult.information_curve.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--color-slate)] mb-2">
                        {"Test qaysi qobiliyat darajasida eng aniq o'lchaydi:"}
                      </p>
                      <InformationCurveChart points={generateResult.information_curve} />
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {wizardStep === 0 && (
                <>
                  <Button variant="ghost" onClick={() => setShowWizard(false)}>Bekor qilish</Button>
                  <Button onClick={() => setWizardStep(1)} disabled={!wTitle.trim()}>
                    Keyingisi
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {wizardStep === 1 && (
                <>
                  <Button variant="ghost" onClick={() => setWizardStep(0)}>
                    <ArrowLeft className="h-4 w-4" />
                    Orqaga
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating || wCount < 1}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Test yaratish
                  </Button>
                </>
              )}
              {wizardStep === 2 && generateResult && (
                <>
                  <Button variant="ghost" onClick={() => setShowWizard(false)}>Yopish</Button>
                  <Button onClick={() => router.push(`/tests/${generateResult.test.id}`)}>
                    Testni ochish
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalPanel>
        </ModalOverlay>
      </Modal>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <QuestionsPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
