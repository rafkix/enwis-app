"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, BookOpen, Zap, Check, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalOverlay, ModalPanel, ModalHeader } from "@/components/ui/modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { adminService, type AdminPlan } from "@/services/admin.service";
import { ApiError } from "@/lib/api";

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-[var(--color-mist)] text-[var(--color-slate)]",
  PRO: "bg-[var(--color-deep)]/10 text-[var(--color-deep)]",
  PREMIUM: "bg-[var(--color-volt)]/20 text-[var(--color-deep)]",
};

const INTERVAL_LABELS: Record<string, string> = {
  monthly: "Oylik",
  yearly: "Yillik",
  one_time: "Bir martalik",
};

const emptyPlan: Partial<AdminPlan> = {
  name: "",
  display_name: "",
  description: "",
  tier: "FREE",
  interval: "monthly",
  price: 0,
  currency: "UZS",
  max_tests: 5,
  max_attempts_per_test: 100,
  max_participants_per_test: 50,
  ai_generation: false,
  ai_questions_per_month: 0,
  advanced_ai: false,
  exam_access: false,
  is_active: true,
};

function PlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: Partial<AdminPlan> | null;
  onClose: () => void;
  onSaved: (p: AdminPlan) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!plan?.id;
  const [form, setForm] = useState<Partial<AdminPlan>>(plan ?? emptyPlan);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AdminPlan, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name || !form.display_name) {
      toast.error("Nom va ko'rsatma nomi majburiy");
      return;
    }
    setSaving(true);
    try {
      const result = isEdit
        ? await adminService.updatePlan(plan!.id!, form)
        : await adminService.createPlan(form);
      onSaved(result);
      toast.success(isEdit ? "Reja yangilandi" : "Reja yaratildi");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay />
      <ModalPanel className="max-w-lg">
        <ModalHeader onClose={onClose}>{isEdit ? "Rejani tahrirlash" : "Yangi reja"}</ModalHeader>
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Kod nomi <span className="text-red-500">*</span></label>
            <Input placeholder="pro_monthly" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} disabled={isEdit} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Ko'rsatma nomi <span className="text-red-500">*</span></label>
            <Input placeholder="PRO (1 oy)" value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Tier</label>
            <Select value={form.tier ?? "FREE"} onChange={(e) => set("tier", e.target.value)}>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="PREMIUM">PREMIUM</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Interval</label>
            <Select value={form.interval ?? "monthly"} onChange={(e) => set("interval", e.target.value)}>
              <option value="monthly">Oylik</option>
              <option value="yearly">Yillik</option>
              <option value="one_time">Bir martalik</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Narx (so'm)</label>
            <Input type="number" min={0} value={form.price ?? 0} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Max testlar (-1=cheksiz)</label>
            <Input type="number" min={-1} value={form.max_tests ?? 5} onChange={(e) => set("max_tests", parseInt(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">AI savollar/oy</label>
            <Input type="number" min={0} value={form.ai_questions_per_month ?? 0} onChange={(e) => set("ai_questions_per_month", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Max urinishlar</label>
            <Input type="number" min={-1} value={form.max_attempts_per_test ?? 100} onChange={(e) => set("max_attempts_per_test", parseInt(e.target.value))} />
          </div>

          <div className="col-span-2 space-y-2 pt-1">
            {([
              ["ai_generation", "AI generatsiya"],
              ["advanced_ai", "Kengaytirilgan AI"],
              ["exam_access", "Imtihon kirishi"],
              ["is_active", "Faol"],
            ] as [keyof AdminPlan, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(form[key])}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--color-deep)]"
                />
                <span className="text-sm text-[var(--color-ink)]">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 border-t border-[var(--color-line)] pt-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>Saqlash</Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function PlansPageContent() {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modalPlan, setModalPlan] = useState<Partial<AdminPlan> | null | undefined>(undefined);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listPlans();
      setPlans(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSeed = async () => {
    const ok = await showConfirm({
      title: "Standart rejalarni yuklash",
      description: "FREE, PRO, PREMIUM standart rejalari yaratiladi. Mavjudlari o'zgartirilmaydi.",
      confirmText: "Yuklash",
    });
    if (!ok) return;
    setSeeding(true);
    try {
      await adminService.seedPlans();
      toast.success("Standart rejalar yuklandi");
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (plan: AdminPlan) => {
    const ok = await showConfirm({
      title: `"${plan.display_name}" ni o'chirish`,
      description: "Bu rejaga faol obunali foydalanuvchilar bo'lmasligi kerak.",
      confirmText: "O'chirish",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await adminService.deletePlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success("Reja o'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  const handleSaved = (saved: AdminPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">Obuna rejalari</h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">{plans.length} ta reja</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSeed} disabled={seeding}>
            <Database size={16} /> Standart yuklash
          </Button>
          <Button variant="primary" size="sm" onClick={() => setModalPlan(emptyPlan)}>
            <Plus size={16} /> Yangi reja
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[var(--radius-xl)]" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-slate)] border border-dashed border-[var(--color-line)] rounded-[var(--radius-xl)]">
          <BookOpen size={36} className="mb-3 opacity-30" />
          <p className="text-sm mb-4">Hali reja yo'q</p>
          <Button variant="ghost" size="sm" onClick={handleSeed}>Standart rejalarni yuklash</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-[var(--radius-xl)] border bg-white p-5 shadow-[var(--shadow-soft-sm)] space-y-3 ${!plan.is_active ? "opacity-60 border-dashed" : "border-[var(--color-line)]"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_COLORS[plan.tier] ?? "bg-gray-100 text-gray-600"}`}>
                    {plan.tier}
                  </span>
                  <p className="font-semibold text-[var(--color-ink)] mt-2">{plan.display_name}</p>
                  <p className="text-xs text-[var(--color-slate)]">{INTERVAL_LABELS[plan.interval] ?? plan.interval}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--color-ink)]">
                    {plan.price === 0 ? "Bepul" : `${(plan.price / 1000).toFixed(0)}K`}
                  </p>
                  {plan.price > 0 && <p className="text-[10px] text-[var(--color-slate)]">so'm</p>}
                </div>
              </div>

              <div className="space-y-1 text-xs text-[var(--color-slate)]">
                <p>Max testlar: <span className="text-[var(--color-ink)] font-medium">{plan.max_tests === -1 ? "∞" : plan.max_tests}</span></p>
                <p>AI savollar/oy: <span className="text-[var(--color-ink)] font-medium">{plan.ai_questions_per_month}</span></p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {plan.ai_generation && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-deep)] bg-[var(--color-volt)]/10 px-1.5 py-0.5 rounded-full">
                    <Zap size={10} /> AI
                  </span>
                )}
                {plan.advanced_ai && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-deep)] bg-[var(--color-volt)]/20 px-1.5 py-0.5 rounded-full">
                    <Zap size={10} /> Advanced AI
                  </span>
                )}
                {plan.exam_access && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-deep)] bg-[var(--color-mist)] px-1.5 py-0.5 rounded-full">
                    <Check size={10} /> Imtihon
                  </span>
                )}
                {!plan.is_active && <Badge variant="default" className="text-[10px]">Nofaol</Badge>}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-line)]">
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setModalPlan(plan)}>
                  <Pencil size={13} /> Tahrirlash
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={() => handleDelete(plan)}
                >
                  <Trash2 size={13} /> O'chirish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalPlan !== undefined && (
        <PlanModal
          plan={modalPlan}
          onClose={() => setModalPlan(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default function AdminPlansPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <PlansPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
