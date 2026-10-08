"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { notificationService } from "@/services/notification.service";
import type { NotificationItem } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  payment_pending: "💳",
  payment_approved: "✅",
  payment_rejected: "❌",
  payment_expired: "⏰",
  subscription_activated: "🎉",
  subscription_expiring: "⚠️",
  subscription_expired: "📅",
  teacher_approved: "🏆",
  teacher_rejected: "😔",
  teacher_purchase_approved: "✅",
  teacher_purchase_rejected: "❌",
  test_attempt_completed: "📝",
  test_published: "📢",
  system: "🔔",
  announcement: "📣",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "default",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (p = 1, onlyUnread = false) => {
    setLoading(true);
    try {
      const res = await notificationService.list({ page: p, per_page: 20, unread_only: onlyUnread });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page, unreadOnly);
  }, [page, unreadOnly, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await notificationService.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Bildirishnomalar
          </h1>
          <p className="text-[var(--color-slate)] mt-1 text-sm">{total} ta bildirishnoma</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 text-[var(--color-deep)]"
          >
            <CheckCheck size={16} />
            Barchasini o&apos;qildi
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-[var(--color-slate)]" />
        <div className="flex gap-1 p-1 bg-[var(--color-mist)] rounded-[var(--radius-lg)]">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => { setUnreadOnly(v); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] transition-all ${
                unreadOnly === v
                  ? "bg-white text-[var(--color-ink)] shadow-sm"
                  : "text-[var(--color-slate)] hover:text-[var(--color-ink)]"
              }`}
            >
              {v ? "O'qilmagan" : "Hammasi"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[var(--color-line)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-slate)]">
            <Bell size={36} className="mb-3 opacity-30" />
            <p className="text-sm">
              {unreadOnly ? "O'qilmagan bildirishnoma yo'q" : "Bildirishnomalar yo'q"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--color-mist)]/40 ${
                  !item.is_read ? "bg-[var(--color-deep)]/[0.02]" : ""
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                    !item.is_read
                      ? "bg-[var(--color-deep)]/10"
                      : "bg-[var(--color-mist)]"
                  }`}
                >
                  {TYPE_ICONS[item.type] ?? "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className={`text-sm font-medium ${!item.is_read ? "text-[var(--color-ink)]" : "text-[var(--color-slate)]"}`}>
                      {item.title}
                    </p>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-deep)] shrink-0" />
                    )}
                    {item.priority !== "normal" && (
                      <Badge variant={PRIORITY_COLORS[item.priority] as "default" | "info" | "warning" | "danger"} className="text-[10px] py-0">
                        {item.priority === "high" ? "Muhim" : item.priority === "urgent" ? "Shoshilinch" : item.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-slate)] line-clamp-2">
                    {item.message}
                  </p>
                  <p className="text-[10px] text-[var(--color-slate-light)] mt-1">
                    {timeAgo(item.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate)] hover:text-[var(--color-deep)] hover:bg-[var(--color-deep)]/10 transition-colors"
                      title="O'qildi deb belgilash"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors disabled:opacity-50"
                    title="O'chirish"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
