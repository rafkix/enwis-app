"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Percent,
  Tag,
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Modal, ModalOverlay, ModalPanel, ModalHeader } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import {
  adminService,
  type AdminPricingPlan,
  type AdminDiscount,
  type AdminPromoCode,
} from "@/services/admin.service";
import { ApiError } from "@/lib/api";

function fmt(n: number) {
  return n.toLocaleString();
}

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/* ── PRICING TAB ──────────────────────────────────────────────────── */

function EditPricingPlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: AdminPricingPlan;
  onClose: () => void;
  onSaved: (p: AdminPricingPlan) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [price, setPrice] = useState(String(plan.price));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [features, setFeatures] = useState(plan.features.map((f) => f.feature));
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((prev) => [...prev, newFeature.trim()]);
    setNewFeature("");
  };

  const removeFeature = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminService.updatePricingPlan(plan.id, {
        name,
        description: description || null,
        price: Number(price),
        is_active: isActive,
        features: features.map((feature, sort_order) => ({ feature, sort_order })),
      });
      toast.success("Reja yangilandi");
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay />
      <ModalPanel>
        <ModalHeader onClose={onClose}>{`"${plan.name}" rejasini tahrirlash`}</ModalHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Nomi</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Tavsif</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Narx (so&apos;m)</label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-ink)]">Faol</label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">Imkoniyatlar</label>
            <div className="space-y-1.5 mb-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-mist)] text-sm">
                  <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> {f}</span>
                  <button onClick={() => removeFeature(i)} className="text-[var(--color-slate)] hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Yangi imkoniyat..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
              />
              <Button variant="ghost" onClick={addFeature}><Plus size={16} /></Button>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>Saqlash</Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function PricingTab() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AdminPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<AdminPricingPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listPricingPlans();
      setPlans(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-[var(--radius-xl)]" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-slate)]">
          <Tag size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Narx rejalari topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft-sm)]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[var(--color-ink)]">{p.name}</h3>
                <Badge variant={p.is_active ? "success" : "default"}>{p.is_active ? "Faol" : "O'chiq"}</Badge>
              </div>
              {p.description && <p className="text-xs text-[var(--color-slate)] mb-3">{p.description}</p>}
              <div className="mb-3">
                {p.discounted_price != null && p.discounted_price !== p.price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-[var(--color-ink)]">{fmt(p.discounted_price)} so&apos;m</span>
                    <span className="text-xs text-[var(--color-slate-light)] line-through">{fmt(p.price)}</span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-[var(--color-ink)]">{fmt(p.price)} so&apos;m</span>
                )}
                {p.discount && (
                  <p className="text-xs text-emerald-600 mt-0.5">-{p.discount.percentage}% "{p.discount.name}"</p>
                )}
              </div>
              <ul className="space-y-1 mb-4 text-xs text-[var(--color-slate)]">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f.id} className="flex items-center gap-1.5">
                    <Check size={11} className="text-emerald-600 shrink-0" /> {f.feature}
                  </li>
                ))}
                {p.features.length === 0 && <li className="text-[var(--color-slate-light)]">Imkoniyatlar yo&apos;q</li>}
              </ul>
              <Button variant="ghost" className="w-full" onClick={() => setEditTarget(p)}>
                <Pencil size={14} /> Tahrirlash
              </Button>
            </div>
          ))}
        </div>
      )}
      {editTarget && (
        <EditPricingPlanModal
          plan={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(saved) => {
            setPlans((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ── DISCOUNTS TAB ────────────────────────────────────────────────── */

function DiscountModal({
  discount,
  plans,
  onClose,
  onSaved,
}: {
  discount: AdminDiscount | null;
  plans: AdminPricingPlan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!discount;
  const [planId, setPlanId] = useState(discount?.plan_id ?? "");
  const [name, setName] = useState(discount?.name ?? "");
  const [percentage, setPercentage] = useState(String(discount?.percentage ?? 10));
  const [startDate, setStartDate] = useState(toDateInputValue(discount?.start_date));
  const [endDate, setEndDate] = useState(toDateInputValue(discount?.end_date));
  const [isActive, setIsActive] = useState(discount?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isEdit && !planId) { toast.error("Reja tanlanishi shart"); return; }
    if (!name.trim() || !startDate || !endDate) { toast.error("Barcha maydonlarni to'ldiring"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await adminService.updateDiscount(discount.id, {
          name,
          percentage: Number(percentage),
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          is_active: isActive,
        });
      } else {
        await adminService.createDiscount({
          plan_id: planId,
          name,
          percentage: Number(percentage),
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        });
      }
      toast.success(isEdit ? "Chegirma yangilandi" : "Chegirma yaratildi");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay />
      <ModalPanel>
        <ModalHeader onClose={onClose}>{isEdit ? "Chegirmani tahrirlash" : "Yangi chegirma"}</ModalHeader>
        <div className="p-6 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Reja</label>
              <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">Tanlang...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)} so&apos;m</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Nomi</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Yozgi chegirma" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Foiz (%)</label>
            <Input type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Boshlanish sanasi</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Tugash sanasi</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-ink)]">Faol</label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>Saqlash</Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function DiscountsTab({ plans }: { plans: AdminPricingPlan[] }) {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<AdminDiscount | null | undefined>(undefined);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listDiscounts();
      setDiscounts(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  const handleDelete = async (d: AdminDiscount) => {
    const ok = await showConfirm({
      title: `"${d.name}" ni o'chirish`,
      description: "Bu chegirma qaytarib bo'lmaydigan tarzda o'chiriladi.",
      confirmText: "O'chirish",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await adminService.deleteDiscount(d.id);
      setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
      toast.success("Chegirma o'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setModalTarget(null)}>
          <Plus size={16} /> Yangi chegirma
        </Button>
      </div>
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-mist)]/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Nomi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Reja</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Foiz</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Muddat</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Holat</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-full" /></td>
                  ))}</tr>
                ))
              ) : discounts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[var(--color-slate)]">
                  <Percent size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Chegirma topilmadi</p>
                </td></tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-[var(--color-mist)]/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[var(--color-ink)]">{d.name}</td>
                    <td className="px-4 py-3.5 text-[var(--color-slate)]">{planName(d.plan_id)}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-emerald-600">-{d.percentage}%</td>
                    <td className="px-4 py-3.5 text-xs text-[var(--color-slate)]">
                      {toDateInputValue(d.start_date)} → {toDateInputValue(d.end_date)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={d.is_active ? "success" : "default"}>{d.is_active ? "Faol" : "O'chiq"}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setModalTarget(d)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-mist)] text-[var(--color-slate)]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-red-50 text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalTarget !== undefined && (
        <DiscountModal
          discount={modalTarget}
          plans={plans}
          onClose={() => setModalTarget(undefined)}
          onSaved={() => { setModalTarget(undefined); fetchDiscounts(); }}
        />
      )}
    </div>
  );
}

/* ── PROMO CODES TAB ──────────────────────────────────────────────── */

function PromoCodeModal({
  promo,
  plans,
  onClose,
  onSaved,
}: {
  promo: AdminPromoCode | null;
  plans: AdminPricingPlan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!promo;
  const [code, setCode] = useState(promo?.code ?? "");
  const [discountType, setDiscountType] = useState(promo?.discount_type ?? "percentage");
  const [discountValue, setDiscountValue] = useState(String(promo?.discount_value ?? 10));
  const [usageLimit, setUsageLimit] = useState(String(promo?.usage_limit ?? 0));
  const [perUserLimit, setPerUserLimit] = useState(String(promo?.per_user_limit ?? 1));
  const [minimumAmount, setMinimumAmount] = useState(String(promo?.minimum_amount ?? 0));
  const [validFrom, setValidFrom] = useState(toDateInputValue(promo?.valid_from));
  const [validUntil, setValidUntil] = useState(toDateInputValue(promo?.valid_until));
  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [planIds, setPlanIds] = useState<string[]>(promo?.plans.map((p) => p.id) ?? []);
  const [saving, setSaving] = useState(false);

  const togglePlan = (id: string) => {
    setPlanIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (code.trim().length < 3) { toast.error("Kod kamida 3 belgi bo'lsin"); return; }
    if (!validFrom || !validUntil) { toast.error("Muddatlarni to'ldiring"); return; }
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        usage_limit: Number(usageLimit),
        per_user_limit: Number(perUserLimit),
        minimum_amount: Number(minimumAmount),
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_active: isActive,
        plan_ids: planIds,
      };
      if (isEdit) {
        await adminService.updatePromoCode(promo.id, payload);
      } else {
        await adminService.createPromoCode(payload);
      }
      toast.success(isEdit ? "Promo-kod yangilandi" : "Promo-kod yaratildi");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalOverlay />
      <ModalPanel>
        <ModalHeader onClose={onClose}>{isEdit ? "Promo-kodni tahrirlash" : "Yangi promo-kod"}</ModalHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Kod</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              maxLength={50}
              className="uppercase font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Chegirma turi</label>
              <Select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="percentage">Foiz (%)</option>
                <option value="fixed">Belgilangan summa</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">
                {discountType === "percentage" ? "Foiz" : "Summa (so'm)"}
              </label>
              <Input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Jami limit (0 = cheksiz)</label>
              <Input type="number" min={0} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Har bir foydalanuvchi uchun</label>
              <Input type="number" min={1} value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Minimal summa (so&apos;m)</label>
            <Input type="number" min={0} value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Boshlanishi</label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Tugashi</label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">Qaysi rejalarga tegishli (bo&apos;sh = barchasi)</label>
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlan(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    planIds.includes(p.id)
                      ? "bg-[var(--color-deep)] text-white border-[var(--color-deep)]"
                      : "bg-white text-[var(--color-slate)] border-[var(--color-line)] hover:border-[var(--color-deep)]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-ink)]">Faol</label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>Saqlash</Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function PromoCodesTab({ plans }: { plans: AdminPricingPlan[] }) {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<AdminPromoCode | null | undefined>(undefined);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listPromoCodes();
      setPromoCodes(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchPromoCodes(); }, [fetchPromoCodes]);

  const handleDelete = async (p: AdminPromoCode) => {
    const ok = await showConfirm({
      title: `"${p.code}" ni o'chirish`,
      description: "Bu promo-kod qaytarib bo'lmaydigan tarzda o'chiriladi.",
      confirmText: "O'chirish",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await adminService.deletePromoCode(p.id);
      setPromoCodes((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Promo-kod o'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setModalTarget(null)}>
          <Plus size={16} /> Yangi promo-kod
        </Button>
      </div>
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-mist)]/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Kod</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Chegirma</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Ishlatilgan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Muddat</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Holat</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-full" /></td>
                  ))}</tr>
                ))
              ) : promoCodes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[var(--color-slate)]">
                  <Ticket size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Promo-kod topilmadi</p>
                </td></tr>
              ) : (
                promoCodes.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-mist)]/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-medium text-[var(--color-ink)]">{p.code}</td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-medium">
                      {p.discount_type === "percentage" ? `-${p.discount_value}%` : `-${fmt(p.discount_value)} so'm`}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[var(--color-slate)]">
                      {p.used_count} / {p.usage_limit === 0 ? "∞" : p.usage_limit}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--color-slate)]">
                      {toDateInputValue(p.valid_from)} → {toDateInputValue(p.valid_until)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={p.is_active ? "success" : "default"}>{p.is_active ? "Faol" : "O'chiq"}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setModalTarget(p)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-mist)] text-[var(--color-slate)]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-red-50 text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalTarget !== undefined && (
        <PromoCodeModal
          promo={modalTarget}
          plans={plans}
          onClose={() => setModalTarget(undefined)}
          onSaved={() => { setModalTarget(undefined); fetchPromoCodes(); }}
        />
      )}
    </div>
  );
}

/* ── PAGE ──────────────────────────────────────────────────────────── */

function PricingPageContent() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [plans, setPlans] = useState<AdminPricingPlan[]>([]);
  const [tab, setTab] = useState("pricing");

  useEffect(() => { if (role !== "admin") router.replace("/"); }, [role, router]);

  // Loaded once here and passed down so DiscountsTab/PromoCodesTab can
  // resolve plan_id -> plan name without a second fetch each.
  useEffect(() => {
    adminService.listPricingPlans().then((res) => setPlans(res.items)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
          Narxlar va Promo-kodlar
        </h1>
        <p className="text-[var(--color-slate)] mt-1 text-sm">
          Obuna narxlari, chegirmalar va promo-kodlarni boshqarish
        </p>
      </div>

      <Tabs defaultValue="pricing" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pricing"><Tag size={14} className="mr-1.5 inline" /> Narxlar</TabsTrigger>
          <TabsTrigger value="discounts"><Percent size={14} className="mr-1.5 inline" /> Chegirmalar</TabsTrigger>
          <TabsTrigger value="promo"><Ticket size={14} className="mr-1.5 inline" /> Promo-kodlar</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing" className="mt-6">
          <PricingTab />
        </TabsContent>
        <TabsContent value="discounts" className="mt-6">
          <DiscountsTab plans={plans} />
        </TabsContent>
        <TabsContent value="promo" className="mt-6">
          <PromoCodesTab plans={plans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPricingPage() {
  return (
    <ToastProvider>
      <DialogProvider>
        <PricingPageContent />
      </DialogProvider>
    </ToastProvider>
  );
}
