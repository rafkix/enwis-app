"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import type { NotificationItem } from "@/lib/types";

export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead, formatDate } =
    useNotificationCenter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async (n: NotificationItem) => {
    if (!n.is_read) await markRead(n.id);
    const testId = (n.data as { test_id?: string } | null)?.test_id;
    if (testId) {
      setOpen(false);
      router.push(`/tests/${testId}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "w-10 h-10 rounded-full flex items-center justify-center text-current active:opacity-60 transition-opacity relative"
            : "w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-slate)] hover:text-[var(--color-ink)] hover:bg-[var(--color-mist)] transition-all duration-200 relative"
        }
        aria-label="Bildirishnomalar"
      >
        <Bell size={compact ? 20 : 18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-[var(--radius-xl)] border border-[var(--color-line)] shadow-[var(--shadow-soft-lg)] z-50 max-h-[420px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)]">
            <p className="text-sm font-medium text-[var(--color-ink)]">Bildirishnomalar</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[var(--color-deep)] hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Hammasini o&apos;qilgan qilish
              </button>
            )}
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--color-slate)]">Yuklanmoqda...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-slate)]">
                Bildirishnomalar yo&apos;q
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-mist)] transition-colors ${
                    !n.is_read ? "bg-[var(--color-deep)]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-deep)] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{n.title}</p>
                      <p className="text-xs text-[var(--color-slate)] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[var(--color-slate-light)] mt-1">
                        {formatDate(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
