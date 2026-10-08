"use client";

import * as React from "react";

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
}

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
  // actions?: NotificationAction[]; // Not available in TypeScript's lib
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (options: NotificationOptions) => Notification | null;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = React.useState<NotificationPermissionState>({
    permission: "default",
    isSupported: typeof window !== "undefined" && "Notification" in window,
  });

  React.useEffect(() => {
    if (state.isSupported) {
      setState((prev) => ({ ...prev, permission: Notification.permission }));
    }
  }, [state.isSupported]);

  const requestPermission = React.useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } catch {
      return "denied";
    }
  }, [state.isSupported]);

  const showNotification = React.useCallback(
    (options: NotificationOptions): Notification | null => {
      if (!state.isSupported || state.permission !== "granted") {
        console.warn("Notifications not supported or permission not granted");
        return null;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || "/favicon.ico",
          badge: options.badge,
          tag: options.tag,
          requireInteraction: options.requireInteraction ?? false,
          silent: options.silent ?? false,
          data: options.data,
        });

        return notification;
      } catch (error) {
        console.error("Failed to show notification:", error);
        return null;
      }
    },
    [state.isSupported, state.permission]
  );

  return {
    permission: state.permission,
    isSupported: state.isSupported,
    requestPermission,
    showNotification,
  };
}

export function useNotificationPermission() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [isRequesting, setIsRequesting] = React.useState(false);

  const handleRequest = React.useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  }, [requestPermission]);

  return {
    permission,
    isSupported,
    isRequesting,
    requestPermission: handleRequest,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
  };
}

export function useNotificationTriggers() {
  const { showNotification, permission, isSupported, requestPermission } = useNotifications();

  const notifyExamStarted = React.useCallback(
    (examTitle: string, examId: string) => {
      return showNotification({
        title: "Imtihon boshlandi",
        body: `${examTitle} imtihoni boshlandi. Hozir ishtirok eting!`,
        tag: `exam-started-${examId}`,
        requireInteraction: true,
        data: { type: "exam_started", examId },
      });
    },
    [showNotification]
  );

  const notifyExamPublished = React.useCallback(
    (examTitle: string, examId: string) => {
      return showNotification({
        title: "Yangi imtihon e'lon qilindi",
        body: `${examTitle} imtihoni endi mavjud. Ro'yxatdan o'ting!`,
        tag: `exam-published-${examId}`,
        data: { type: "exam_published", examId },
      });
    },
    [showNotification]
  );

  const notifyNewResult = React.useCallback(
    (examTitle: string, score: number, total: number, examId: string) => {
      const percentage = Math.round((score / total) * 100);
      return showNotification({
        title: "Natija tayyor",
        body: `Siz ${examTitle} imtihonida ${score}/${total} (${percentage}%) ball topladingiz.`,
        tag: `result-${examId}`,
        requireInteraction: true,
        data: { type: "result", examId, score, total },
      });
    },
    [showNotification]
  );

  const notifyAnnouncement = React.useCallback(
    (title: string, message: string, data?: Record<string, unknown>) => {
      return showNotification({
        title: `E'lon: ${title}`,
        body: message,
        tag: `announcement-${Date.now()}`,
        requireInteraction: true,
        data: { type: "announcement", ...data },
      });
    },
    [showNotification]
  );

  const notifyReminder = React.useCallback(
    (examTitle: string, minutesLeft: number, examId: string) => {
      return showNotification({
        title: "Imtihon eslatmasi",
        body: `${examTitle} imtihoni ${minutesLeft} daqiqa ichida boshlanadi!`,
        tag: `reminder-${examId}`,
        requireInteraction: true,
        data: { type: "reminder", examId, minutesLeft },
      });
    },
    [showNotification]
  );

  const notifyAchievement = React.useCallback(
    (achievementName: string, description: string) => {
      return showNotification({
        title: "Yangilik! 🏆",
        body: `Siz "${achievementName}" mukofotini qo'lga kiritdingiz. ${description}`,
        tag: `achievement-${Date.now()}`,
        requireInteraction: false,
        data: { type: "achievement", achievementName },
      });
    },
    [showNotification]
  );

  return {
    showNotification,
    notifyExamStarted,
    notifyExamPublished,
    notifyNewResult,
    notifyAnnouncement,
    notifyReminder,
    notifyAchievement,
    permission,
    isSupported,
    requestPermission,
  };
}