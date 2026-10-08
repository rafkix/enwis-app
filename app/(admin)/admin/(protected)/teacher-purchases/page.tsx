"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  Check,
  X,
  Eye,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Modal, ModalOverlay, ModalPanel, ModalHeader } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { adminService, type AdminTeacherPurchase } from "@/services/admin.service";
import { ApiError, API_BASE } from "@/lib/api";

// Mirrors STATUS_MAP in admin/payments/page.tsx — separate purchase flow,
// same status vocabulary (pending | waiting_for_review | completed |
// rejected | expired | cancelled).
const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  pending: { label: "Kutilmoqda", variant: "warning" },
  waiting_for_review: { label: "Ko'rib chiqilmoqda", variant: "info" },
  completed: { label: "Tasdiqlangan", variant: "success" },
  rejected: { label: "Rad etildi", variant: "danger" },
  expired: { label: "Muddati tugagan", variant: "default" },
  cancelled: { label: "Bekor qilindi", variant: "default" },
};

function ApproveModal({ purchase, onClose, onDone }: { purchase: AdminTeacherPurchase; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await adminService.approveTeacherPurchase(purchase.id, note || undefined);
      toast.success("O'qituvchi paketi tasdiqlandi");
      onDone();
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
        <ModalHeader onClose={onClose}>Xaridni tasdiqlash</ModalHeader>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-mist)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-slate)]">Summa</span>
              <span className="font-medium">{purchase.amount.toLocaleString()} {purchase.currency}</span>
            </div>
            {purchase.receipt_image && (
              <a
                href={`${API_BASE}${adminService.getTeacherPurchaseReceiptUrl(purchase.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[var(--color-deep)] hover:underline text-xs"
              >
                <Eye size={12} /> Chekni ko&apos;rish
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          <p className="text-xs text-[var(--color-slate)]">
            Tasdiqlanganda foydalanuvchiga TEACHER roli avtomatik beriladi.
          </p>
          <div>
            <label className="block text-xs text-[var(--color-slate)] mb-1">Izoh (ixtiyoriy)</label>
            <Input placeholder="Xarid tasdiqlandi..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={handle} disabled={saving}>
            <Check size={16} /> Tasdiqlash
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function RejectModal({ purchase, onClose, onDone }: { purchase: AdminTeacherPurchase; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (reason.trim().length < 1) { toast.error("Sabab kiritilishi shart"); return; }
    setSaving(true);
    try {
      await adminService.rejectTeacherPurchase(purchase.id, reason.trim());
      toast.success("Xarid rad etildi");
      onDone();
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
        <ModalHeader onClose={onClose}>Xaridni rad etish</ModalHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--color-slate)]">
            Bu sabab foydalanuvchiga ko&apos;rsatiladi.
          </p>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink)] mb-1">
              Sabab <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-deep)]/20 focus:border-[var(--color-deep)]"
              rows={3}
              placeholder="Chek rasmida karta raqami ko'rinmaydi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handle}
            disabled={saving || reason.trim().length < 1}
          >
            <X size={16} /> Rad etish
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function TeacherPurchasesPageContent() {
  const [purchases, setPurchases] = useState<AdminTeacherPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("waiting_for_review");
  const [approveTarget, setApproveTarget] = useState<AdminTeacherPurchase | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminTeacherPurchase | null>(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listTeacherPurchases({ page, status: statusFilter || undefined });
      setPurchases(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleDone = () => {
    setApproveTarget(null);
    setRejectTarget(null);
    fetchPurchases();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            O&apos;qituvchi paketi xaridlari
          </h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">{total} ta xarid</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-[var(--color-slate)] shrink-0" />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-48">
          <option value="">Barcha holatlar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="waiting_for_review">Ko&apos;rib chiqilmoqda</option>
          <option value="completed">Tasdiqlangan</option>
          <option value="rejected">Rad etildi</option>
          <option value="expired">Muddati tugagan</option>
          <option value="cancelled">Bekor qilindi</option>
        </Select>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-mist)]/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Foydalanuvchi</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Summa</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Holat</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Chek</th>
                <th className="w-28 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--color-slate)]">
                    <GraduationCap size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Xarid topilmadi</p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const statusInfo = STATUS_MAP[p.status] ?? STATUS_MAP.pending;
                  const canAction = p.status === "waiting_for_review";
                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-mist)]/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-mono text-[var(--color-slate-light)]">
                          {p.user_id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[var(--color-ink)]">
                        {p.amount.toLocaleString()} {p.currency}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {p.receipt_image ? (
                          <a
                            href={`${API_BASE}${adminService.getTeacherPurchaseReceiptUrl(p.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-deep)] hover:underline"
                          >
                            <Eye size={12} /> Ko&apos;rish
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--color-slate-light)]">Yuklanmagan</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {canAction && (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setApproveTarget(p)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                            >
                              <Check size={12} /> Tasdiqlash
                            </button>
                            <button
                              onClick={() => setRejectTarget(p)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                            >
                              <X size={12} /> Rad
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center py-4 border-t border-[var(--color-line)]">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {approveTarget && (
        <ApproveModal purchase={approveTarget} onClose={() => setApproveTarget(null)} onDone={handleDone} />
      )}
      {rejectTarget && (
        <RejectModal purchase={rejectTarget} onClose={() => setRejectTarget(null)} onDone={handleDone} />
      )}
    </div>
  );
}

export default function AdminTeacherPurchasesPage() {
  return (
    <ToastProvider>
      <TeacherPurchasesPageContent />
    </ToastProvider>
  );
}
