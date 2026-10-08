"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "@/services/notification.service";
import type { NotificationItem } from "@/lib/types";

/**
 * Shared data/actions behind the notification bell — polls every 30s,
 * tracks unread count, and exposes mark-read / mark-all-read. Used by
 * the desktop Topbar, mobile web header, and Telegram header so the three
 * different-looking bells all stay backed by one source of truth instead
 * of three copies of the same fetch/poll logic.
 */
export function useNotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    try {
      const data = await notificationService.list({ per_page: 8 });
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
      firstLoad.current = false;
      seenIds.current = new Set(data.items.map((n) => n.id));
    } catch {
      // Silent — the bell just shows stale/empty state until next poll.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Best-effort — next poll reconciles state either way.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Best-effort — next poll reconciles state either way.
    }
  }, []);

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "hozir";
    if (diffMin < 60) return `${diffMin} daq oldin`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} soat oldin`;
    return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, formatDate };
}
