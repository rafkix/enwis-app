"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto",
  {
    variants: {
      size: {
        sm: "",
        md: "",
        lg: "",
        xl: "",
        full: "",
      },
    },
    defaultVariants: { size: "md" },
  }
);

const panelVariants = cva(
  "relative w-full max-h-[90vh] flex flex-col overflow-hidden bg-white rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft-lg)] transform transition-all duration-300 ease-[var(--ease-editorial)]",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[90vw]",
      },
    },
    defaultVariants: { size: "md" },
  }
);

type DialogVariant = "info" | "success" | "warning" | "danger" | "confirm";

const variantIcons: Record<DialogVariant, React.ReactNode> = {
  info: <Info className="h-6 w-6 text-[var(--color-deep)]" />,
  success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
  danger: <AlertCircle className="h-6 w-6 text-red-600" />,
  confirm: <AlertTriangle className="h-6 w-6 text-amber-600" />,
};

const variantColors: Record<DialogVariant, string> = {
  info: "bg-[var(--color-deep)]/10 text-[var(--color-deep)]",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  confirm: "bg-amber-100 text-amber-700",
};

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  variant?: DialogVariant;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  preventCloseOnConfirm?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

function AlertDialog({
  open,
  onClose,
  variant = "info",
  title,
  description,
  confirmText = "Tasdiqlash",
  cancelText = "Bekor qilish",
  showCancel = true,
  onConfirm,
  onCancel,
  loading = false,
  preventCloseOnConfirm = false,
  size = "md",
}: AlertDialogProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
      if (!preventCloseOnConfirm) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const Icon = variantIcons[variant];
  const iconColor = variantColors[variant];

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalOverlay>
        <ModalPanel size={size}>
          <div className="w-full p-6 overflow-y-auto min-h-0">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
              >
                {Icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)] break-words">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 text-sm text-[var(--color-slate)] break-words">{description}</p>
                )}
              </div>
            </div>
            <div data-modal-footer className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {showCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  size="md"
                >
                  {cancelText}
                </Button>
              )}
              <Button
                variant={
                  variant === "danger" || variant === "warning"
                    ? "destructive"
                    : "primary"
                }
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </ModalPanel>
      </ModalOverlay>
    </Modal>
  );
}

interface ModalContextValue {
  open: boolean;
  onClose: () => void;
}

const ModalContext = React.createContext<ModalContextValue>({
  open: false,
  onClose: () => {},
});

function useModal() {
  return React.useContext(ModalContext);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ open, onClose, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalContext.Provider value={{ open, onClose }}>
      {children}
    </ModalContext.Provider>
  );
}

interface ModalOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {}

const ModalOverlay = React.forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ className, children, ...props }, ref) => {
    const { onClose } = useModal();
    return (
      <div
        ref={ref}
        className={cn(modalVariants(), className)}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalOverlay.displayName = "ModalOverlay";

interface ModalPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

const ModalPanel = React.forwardRef<HTMLDivElement, ModalPanelProps>(
  ({ className, size, children, ...props }, ref) => (
    <div ref={ref} className={cn(panelVariants({ size }), className)} {...props}>
      {children}
    </div>
  )
);
ModalPanel.displayName = "ModalPanel";

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean;
  onClose?: () => void;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, showClose = true, onClose: onCloseOverride, ...props }, ref) => {
    const { onClose: closeModal } = useModal();
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4 shrink-0",
          className
        )}
        {...props}
      >
        <div className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)] break-words min-w-0 flex-1">
          {children}
        </div>
        {showClose && (
          <button
            onClick={onCloseOverride ?? closeModal}
            className="rounded-full p-1.5 text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);
ModalHeader.displayName = "ModalHeader";

const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-5 overflow-y-auto min-h-0 flex-1", className)} {...props} />
  )
);
ModalBody.displayName = "ModalBody";

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-modal-footer
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4 shrink-0",
        className
      )}
      {...props}
    />
  )
);
ModalFooter.displayName = "ModalFooter";

export { Modal, ModalOverlay, ModalPanel, ModalHeader, ModalBody, ModalFooter, AlertDialog, useModal, panelVariants, modalVariants, X, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info, Button };
