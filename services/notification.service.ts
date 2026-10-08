import { api } from "@/lib/api";
import type { NotificationListResponse, NotificationItem, MessageResponse } from "@/lib/types";

export const notificationService = {
  list: (params?: { page?: number; per_page?: number; unread_only?: boolean }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      per_page: String(params?.per_page ?? 20),
    });
    if (params?.unread_only) qs.set("unread_only", "true");
    return api.get<NotificationListResponse>(`/notifications?${qs.toString()}`);
  },

  markRead: (id: string) => api.post<NotificationItem>(`/notifications/${id}/read`),

  unreadCount: () => api.get<{ unread_count: number }>(`/notifications/unread-count`),

  markAllRead: () => api.post<{ updated_count: number }>(`/notifications/read-all`),

  delete: (id: string) => api.delete<MessageResponse>(`/notifications/${id}`),
};
