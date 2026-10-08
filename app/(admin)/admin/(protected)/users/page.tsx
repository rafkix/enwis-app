"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  UserX,
  Infinity as InfinityIcon,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Modal, ModalOverlay, ModalPanel, ModalHeader } from "@/components/ui/modal";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { adminService, type AdminUser } from "@/services/admin.service";
import { ApiError } from "@/lib/api";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
  active: { label: "Faol", variant: "success" },
  blocked: { label: "Bloklangan", variant: "danger" },
  pending: { label: "Kutmoqda", variant: "warning" },
};

const TIER_BADGE: Record<string, string> = {
  FREE: "bg-[var(--color-mist)] text-[var(--color-slate)]",
  PRO: "bg-[var(--color-deep)]/10 text-[var(--color-deep)]",
  PREMIUM: "bg-[var(--color-volt)]/20 text-[var(--color-deep)]",
  TEACHER: "bg-[var(--color-deep)] text-white",
  ADMIN: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
};

function QuotaDisplay({ val }: { val: number | null }) {
  if (val === null) return <span className="text-[var(--color-slate)]">Standart</span>;
  if (val === -1) return <span className="flex items-center gap-1 text-emerald-600"><InfinityIcon size={14} /> Cheksiz</span>;
  return <span>{val}</span>;
}

function RolesModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
}) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<string[]>(user.roles);
  const [saving, setSaving] = useState(false);

  const toggle = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminService.updateUserRoles(user.id, roles);
      onSaved(updated);
      toast.success("Rollar yangilandi");
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
        <ModalHeader onClose={onClose}>{`Rollar — ${user.full_name ?? user.username}`}</ModalHeader>
        <div className="p-6 space-y-3">
          {["STUDENT", "TEACHER", "ADMIN"].map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={roles.includes(r)}
                onChange={() => toggle(r)}
                className="w-4 h-4 rounded accent-[var(--color-deep)]"
              />
              <span className="text-sm font-medium text-[var(--color-ink)]">{r}</span>
            </label>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
            Saqlash
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function QuotaModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"standard" | "unlimited" | "custom">(
    user.ai_questions_quota_override === null
      ? "standard"
      : user.ai_questions_quota_override === -1
      ? "unlimited"
      : "custom"
  );
  const [customVal, setCustomVal] = useState(
    user.ai_questions_quota_override !== null && user.ai_questions_quota_override !== -1
      ? String(user.ai_questions_quota_override)
      : ""
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const val = mode === "standard" ? null : mode === "unlimited" ? -1 : parseInt(customVal) || 0;
    try {
      const updated = await adminService.updateUserAiQuota(user.id, val, reason || undefined);
      onSaved(updated);
      toast.success("AI kvota yangilandi");
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
        <ModalHeader onClose={onClose}>{`AI kvota — ${user.full_name ?? user.username}`}</ModalHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {[
              { v: "standard", label: "Standart (tier limiti)" },
              { v: "unlimited", label: "Cheksiz (-1)" },
              { v: "custom", label: "Maxsus son" },
            ].map((opt) => (
              <label key={opt.v} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === opt.v}
                  onChange={() => setMode(opt.v as typeof mode)}
                  className="accent-[var(--color-deep)]"
                />
                <span className="text-sm text-[var(--color-ink)]">{opt.label}</span>
              </label>
            ))}
          </div>
          {mode === "custom" && (
            <Input
              type="number"
              min={0}
              placeholder="Masalan: 50"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
            />
          )}
          <div>
            <label className="block text-xs text-[var(--color-slate)] mb-1">Sabab (ixtiyoriy)</label>
            <Input
              placeholder="Marketing kampanikasi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor</Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
            Saqlash
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const { toast } = useToast();
  const showConfirm = useConfirm();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  const [rolesModalUser, setRolesModalUser] = useState<AdminUser | null>(null);
  const [quotaModalUser, setQuotaModalUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (role !== "admin") { router.replace("/"); }
  }, [role, router]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listUsers({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        tier: tierFilter || undefined,
      });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(Math.ceil(res.total / 20));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, tierFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusToggle = async (u: AdminUser) => {
    const newStatus = u.status === "blocked" ? "active" : "blocked";
    const label = newStatus === "blocked" ? "bloklash" : "faollashtirish";
    const ok = await showConfirm({
      title: `Foydalanuvchini ${label}`,
      description: `${u.full_name ?? u.username} ni ${label}ni xohlaysizmi?`,
      confirmText: label.charAt(0).toUpperCase() + label.slice(1),
      variant: newStatus === "blocked" ? "danger" : "confirm",
    });
    if (!ok) return;
    try {
      const updated = await adminService.updateUserStatus(u.id, newStatus);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: updated.status } : x));
      toast.success(`Foydalanuvchi ${label}landi`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  const handleDelete = async (u: AdminUser) => {
    const ok = await showConfirm({
      title: "Foydalanuvchini o'chirish",
      description: `${u.full_name ?? u.username} ni o'chirishni xohlaysizmi? (Soft delete)`,
      confirmText: "O'chirish",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await adminService.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("Foydalanuvchi o'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Xatolik");
    }
  };

  const onUserUpdated = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, ...updated } : u));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Foydalanuvchilar
          </h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">{total.toLocaleString()} ta foydalanuvchi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-slate-light)]" />
          <Input
            placeholder="Ism, login, telefon..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-36">
          <option value="">Holat</option>
          <option value="active">Faol</option>
          <option value="blocked">Bloklangan</option>
          <option value="pending">Kutmoqda</option>
        </Select>
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full sm:w-36">
          <option value="">Rol</option>
          <option value="STUDENT">STUDENT</option>
          <option value="TEACHER">TEACHER</option>
          <option value="ADMIN">ADMIN</option>
        </Select>
        <Select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }} className="w-full sm:w-36">
          <option value="">Tier</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="TEACHER">TEACHER</option>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-mist)]/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Foydalanuvchi</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Holat</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Plan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">AI kvota</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-slate)] uppercase tracking-wide">Rollar</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3.5"><Skeleton className="h-9 w-48" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-14 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-20 mx-auto" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-6 w-6" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-slate)]">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Foydalanuvchi topilmadi</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const statusInfo = STATUS_BADGE[u.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr key={u.id} className="hover:bg-[var(--color-mist)]/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-deep)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-deep)] shrink-0">
                            {(u.full_name ?? u.username ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">{u.full_name ?? "—"}</p>
                            <p className="text-xs text-[var(--color-slate-light)]">@{u.username ?? u.public_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_BADGE[u.subscription_tier] ?? "bg-gray-100 text-gray-600"}`}>
                          {u.subscription_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        <QuotaDisplay val={u.ai_questions_quota_override} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {u.roles.map((r) => (
                            <span key={r} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIER_BADGE[r] ?? "bg-gray-100 text-gray-600"}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate)] hover:bg-[var(--color-mist)] transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownTrigger>
                          <DropdownContent>
                            <DropdownItem onClick={() => setRolesModalUser(u)}>
                              <ShieldCheck size={14} className="mr-2" />
                              Rolni o&apos;zgartirish
                            </DropdownItem>
                            <DropdownItem onClick={() => setQuotaModalUser(u)}>
                              <Zap size={14} className="mr-2" />
                              AI kvota
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem onClick={() => handleStatusToggle(u)}>
                              {u.status === "blocked" ? (
                                <><ShieldCheck size={14} className="mr-2 text-emerald-600" />Faollashtirish</>
                              ) : (
                                <><ShieldX size={14} className="mr-2 text-amber-600" />Bloklash</>
                              )}
                            </DropdownItem>
                            <DropdownItem danger onClick={() => handleDelete(u)}>
                              <UserX size={14} className="mr-2" />
                              O&apos;chirish
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
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

      {rolesModalUser && (
        <RolesModal
          user={rolesModalUser}
          onClose={() => setRolesModalUser(null)}
          onSaved={(u) => { onUserUpdated(u); setRolesModalUser(null); }}
        />
      )}
      {quotaModalUser && (
        <QuotaModal
          user={quotaModalUser}
          onClose={() => setQuotaModalUser(null)}
          onSaved={(u) => { onUserUpdated(u); setQuotaModalUser(null); }}
        />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <UsersPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
