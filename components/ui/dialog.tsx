"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/modal";

export type DialogVariant = "info" | "success" | "warning" | "danger" | "confirm";

interface ConfirmDialogOptions {
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  preventCloseOnConfirm?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

interface DialogState {
  open: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((value: boolean) => void) | null;
}

const DialogContext = React.createContext<{
  state: DialogState;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
} | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>({
    open: false,
    options: null,
    resolve: null,
  });

  const showConfirm = React.useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        options: { ...options, onConfirm: options.onConfirm, onCancel: options.onCancel },
        resolve,
      });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    if (state.options?.onConfirm) {
      Promise.resolve(state.options.onConfirm()).then(() => {
        state.resolve?.(true);
        setState({ open: false, options: null, resolve: null });
      });
    } else {
      state.resolve?.(true);
      setState({ open: false, options: null, resolve: null });
    }
  }, [state]);

  const handleCancel = React.useCallback(() => {
    if (state.options?.onCancel) {
      state.options.onCancel();
    }
    state.resolve?.(false);
    setState({ open: false, options: null, resolve: null });
  }, [state]);

  return (
    <DialogContext.Provider value={{ state, showConfirm }}>
      {children}
      {state.open && state.options && (
        <AlertDialog
          open={state.open}
          onClose={handleCancel}
          variant={state.options.variant}
          title={state.options.title}
          description={state.options.description}
          confirmText={state.options.confirmText}
cancelText={state.options.cancelText}
            showCancel={!!state.options.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={state.options.loading}
          preventCloseOnConfirm={state.options.preventCloseOnConfirm}
          size={state.options.size}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within a DialogProvider");
  }
  return context.showConfirm;
}

export function ConfirmDialogTrigger({ 
  children, 
  onConfirm, 
  onCancel, 
  ...props 
}: { children: React.ReactNode; onConfirm?: () => void | Promise<void>; onCancel?: () => void } & Omit<ConfirmDialogOptions, "onConfirm" | "onCancel">) {
  const showConfirm = useConfirm();

  const handleClick = async () => {
    const confirmed = await showConfirm({ 
      ...props, 
      onConfirm, 
      onCancel 
    } as ConfirmDialogOptions);
    if (confirmed && onConfirm) {
      await onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }
  };

  // Filter out dialog-specific props that shouldn't be passed to Button
  const { 
    title, 
    description, 
    variant, 
    size, 
    loading, 
    confirmText, 
    cancelText, 
    preventCloseOnConfirm,
    ...buttonProps 
  } = props;

  return <Button {...buttonProps} onClick={handleClick}>{children}</Button>;
}

export function useAlert() {
  const showConfirm = useConfirm();

  const alert = React.useCallback(
    (message: string, options?: Omit<ConfirmDialogOptions, "title" | "confirmText" | "cancelText" | "showCancel">) => {
      return showConfirm({
        title: "Xabar",
        description: message,
        confirmText: "OK",
        showCancel: false,
        ...options,
      });
    },
    [showConfirm]
  );

  return { alert };
}

export { AlertDialog } from "@/components/ui/modal";