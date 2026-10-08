"use client";

import * as React from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: React.ReactNode;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant, options?: { action?: React.ReactNode; duration?: number }) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  addToast: () => "",
  removeToast: () => {},
});

export function useToast() {
  const context = React.useContext(ToastContext);
  return {
    addToast: context.addToast,
    removeToast: context.removeToast,
    toast: {
      success: (message: string, options?: { action?: React.ReactNode; duration?: number }) => context.addToast(message, "success", options),
      error: (message: string, options?: { action?: React.ReactNode; duration?: number }) => context.addToast(message, "danger", options),
      warning: (message: string, options?: { action?: React.ReactNode; duration?: number }) => context.addToast(message, "warning", options),
      info: (message: string, options?: { action?: React.ReactNode; duration?: number }) => context.addToast(message, "info", options),
    }
  };
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  danger: <XCircle className="h-4 w-4 text-[var(--color-danger)]" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const toastStyles: Record<ToastVariant, string> = {
  default: "bg-[var(--color-deep)] text-white",
  success: "bg-emerald-50 border border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border border-amber-200 text-amber-800",
  danger: "bg-[var(--color-danger-light)] border border-red-200 text-red-800",
  info: "bg-blue-50 border border-blue-200 text-blue-800",
};

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const [progress, setProgress] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (toast.duration === 0) return;
    
    const interval = setInterval(() => {
      if (!isHovered) {
        setProgress((p) => p + 100 / ((toast.duration ?? 4000) / 100));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isHovered, toast.duration]);

  React.useEffect(() => {
    if (progress >= 100) {
      onRemove(toast.id);
    }
  }, [progress, toast.id, onRemove]);

  const Icon = toastIcons[toast.variant];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3 text-sm shadow-[var(--shadow-soft-md)] transition-all duration-300 animate-in slide-in-from-right",
        toastStyles[toast.variant]
      )}
      style={{ maxWidth: 400 }}
    >
      {Icon}
      <span className="flex-1">{toast.message}</span>
      {toast.action}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div
        className="absolute bottom-0 left-0 h-1 rounded-bl-[var(--radius-lg)] rounded-br-[var(--radius-lg)] bg-black/10"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxToasts?: number;
}

export function Toaster({ position = "top-right", maxToasts = 5 }: ToasterProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant = "default", options?: { action?: React.ReactNode; duration?: number }) => {
      const id = Math.random().toString(36).slice(2);
      const newToast: ToastItem = {
        id,
        message,
        variant,
        action: options?.action,
        duration: options?.duration ?? 4000,
      };
      setToasts((prev) => {
        const next = [...prev, newToast].slice(-maxToasts);
        return next;
      });
      return id;
    },
    [maxToasts]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const positionStyles: Record<string, string> = {
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6",
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6",
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <div className={cn("z-[100] flex flex-col gap-2", positionStyles[position])}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ addToast: () => "", removeToast: () => {} }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export const toast = {
  success: (message: string, options?: { action?: React.ReactNode; duration?: number }) => {
    console.log("toast.success:", message, options);
  },
  error: (message: string, options?: { action?: React.ReactNode; duration?: number }) => {
    console.log("toast.error:", message, options);
  },
  warning: (message: string, options?: { action?: React.ReactNode; duration?: number }) => {
    console.log("toast.warning:", message, options);
  },
  info: (message: string, options?: { action?: React.ReactNode; duration?: number }) => {
    console.log("toast.info:", message, options);
  },
};