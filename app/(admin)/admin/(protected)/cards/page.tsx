"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, CreditCard, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalOverlay, ModalPanel, ModalHeader } from "@/components/ui/modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { adminService, type AdminCard } from "@/services/admin.service";
import { ApiError } from "@/lib/api";

const emptyCard: Omit<AdminCard, "id"> = {
  bank_name: "",
  card_number: "",
  card_holder_name: "ENWIS PLATFORM",
  is_active: true,
  sort_order: 0,
};

function CardModal({
  card,
  onClose,
  onSaved,
}: {
  card: Partial<AdminCard> | null;
  onClose: () => void;
  onSaved: (c: AdminCard) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!card?.id;
  const [form, setForm] = useState({ ...emptyCard, ...card });
  const [saving, setSaving] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const set = (k: keyof typeof form, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.bank_name || !form.card_number || !form.card_holder_name) {
      toast.error("Barcha maydonlar majburiy");
      return;
    }
    setSaving(true);
    try {
      const result = isEdit
        ? await adminService.updateCard(card!.id!, form)
        : await adminService.createCard(form);
      onSaved(result);
      toast.success(isEdit ? "Karta yangilandi" : "Karta qo'shildi");
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
      <ModalPanel>
        <ModalHeader onClose={onClose}>{isEdit ? "Kartani tahrirlash" : "Yangi karta"}</ModalHeader>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Bank nomi <span className="text-red-500">*</span></label>
            <Input placeholder="Kapitalbank" value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Karta raqami <span className="text-red-500">*</span></label>
            <div className="relative">
              <Input
                type={showFull ? "text" : "password"}
                placeholder="8600 1234 5678 9012"
                className="pr-10"
                value={form.card_number}
                onChange={(e) => set("card_number", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowFull(!showFull)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)]"
              >
                {showFull ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">Karta egasi <span className="text-red-500">*</span></label>
            <Input placeholder="ENWIS PLATFORM" value={form.card_holder_name} onChange={(e) => set("card_holder_name", e.target.value)} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-deep)]"
            />
            <span className="text-sm text-[var(--color-ink)]">Faol (foydalanuvchilarga ko&apos;rinadi)</span>
          </label>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>Saqlash</Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function CardsPageContent() {
  const { toast } = useToast();
  const showConfirm = useConfirm();
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCard, setModalCard] = useState<Partial<AdminCard> | null | undefined>(undefined);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listCards();
      setCards(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleDelete = async (card: AdminCard) => {
    const ok = await showConfirm({
      title: "Kartani o'chirish",
      description: `${card.bank_name} kartasini o'chirishni xohlaysizmi? Bu kartaga bog'liq kutilayotgan to'lovlar bo'lmasligi kerak.`,
      confirmText: "O'chirish",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await adminService.deleteCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      toast.success("Karta o'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  const handleSaved = (saved: AdminCard) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
  };

  const maskCard = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.length <= 8) return num;
    return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">To&apos;lov kartalari</h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">Foydalanuvchilar to&apos;laydigan kartalar</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalCard(emptyCard)}>
          <Plus size={16} /> Yangi karta
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[var(--radius-xl)]" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-slate)] border border-dashed border-[var(--color-line)] rounded-[var(--radius-xl)]">
          <CreditCard size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Hali karta yo&apos;q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-[var(--radius-xl)] border p-6 shadow-[var(--shadow-soft-sm)] space-y-4 ${
                card.is_active
                  ? "bg-gradient-to-br from-[var(--color-deep)] to-[var(--color-deep-800)] text-white border-transparent"
                  : "bg-white border-[var(--color-line)] border-dashed opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium mb-1 ${card.is_active ? "text-white/60" : "text-[var(--color-slate)]"}`}>
                    {card.bank_name}
                  </p>
                  <p className={`text-lg font-mono font-medium tracking-wider ${card.is_active ? "text-white" : "text-[var(--color-ink)]"}`}>
                    {maskCard(card.card_number)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!card.is_active && <Badge variant="default" className="text-[10px]">Nofaol</Badge>}
                </div>
              </div>
              <p className={`text-sm font-medium ${card.is_active ? "text-white/80" : "text-[var(--color-slate)]"}`}>
                {card.card_holder_name}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModalCard(card)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[var(--radius-md)] font-medium transition-colors ${
                    card.is_active
                      ? "bg-white/15 hover:bg-white/25 text-white"
                      : "bg-[var(--color-mist)] hover:bg-[var(--color-line)] text-[var(--color-ink)]"
                  }`}
                >
                  <Pencil size={12} /> Tahrirlash
                </button>
                <button
                  onClick={() => handleDelete(card)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[var(--radius-md)] font-medium transition-colors ${
                    card.is_active
                      ? "bg-red-500/20 hover:bg-red-500/30 text-white"
                      : "bg-red-50 hover:bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 size={12} /> O&apos;chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalCard !== undefined && (
        <CardModal
          card={modalCard}
          onClose={() => setModalCard(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default function AdminCardsPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <CardsPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
