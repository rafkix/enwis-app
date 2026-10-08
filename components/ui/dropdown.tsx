"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = React.createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

function useDropdown() {
  return React.useContext(DropdownContext);
}

interface DropdownProps {
  children: React.ReactNode;
}

function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownTriggerProps
>(({ children, asChild, ...props }, _ref) => {
  const { setOpen, triggerRef } = useDropdown();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => {
          setOpen((p) => !p);
          const childProps = (
            children as React.ReactElement<Record<string, unknown>>
          ).props;
          if (typeof childProps.onClick === "function") childProps.onClick(e);
        },
      },
    );
  }
  return (
    <button ref={triggerRef} onClick={() => setOpen((p) => !p)} {...props}>
      {children}
    </button>
  );
});
DropdownTrigger.displayName = "DropdownTrigger";

const contentVariants = cva(
  "fixed z-50 min-w-[12rem] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white py-1 shadow-[var(--shadow-soft-md)]",
  {
    variants: {
      align: {
        left: "",
        center: "",
        right: "",
      },
    },
    defaultVariants: { align: "right" },
  },
);

interface DropdownContentProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentVariants> {}

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, align = "right", style, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useDropdown();
    const localRef = React.useRef<HTMLDivElement>(null);
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(
      null,
    );

    // Merge the forwarded ref with our local ref so we can measure the
    // menu's own width (needed to right-align it against the trigger).
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef)
          (
            forwardedRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
      },
      [forwardedRef],
    );

    const recalculate = React.useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = localRef.current?.offsetWidth ?? 192; // fallback ~ min-w-[12rem]
      const gap = 8;

      let left: number;
      if (align === "left") {
        left = rect.left;
      } else if (align === "center") {
        left = rect.left + rect.width / 2 - menuWidth / 2;
      } else {
        left = rect.right - menuWidth;
      }
      // Keep the menu on-screen horizontally.
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

      let top = rect.bottom + gap;
      // If there isn't room below, flip above the trigger.
      const menuHeight = localRef.current?.offsetHeight ?? 0;
      if (
        top + menuHeight > window.innerHeight - 8 &&
        rect.top - gap - menuHeight > 0
      ) {
        top = rect.top - gap - menuHeight;
      }

      setPos({ top, left });
    }, [align, triggerRef]);

    React.useLayoutEffect(() => {
      if (!open) return;
      recalculate();
    }, [open, recalculate]);

    React.useEffect(() => {
      if (!open) return;

      const handleClickAway = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          localRef.current &&
          !localRef.current.contains(target)
        ) {
          setOpen(false);
        }
      };
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      const handleReposition = () => recalculate();

      document.addEventListener("mousedown", handleClickAway);
      document.addEventListener("keydown", handleKey);
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);
      return () => {
        document.removeEventListener("mousedown", handleClickAway);
        document.removeEventListener("keydown", handleKey);
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }, [open, recalculate, setOpen, triggerRef]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
      <div
        ref={setRefs}
        className={cn(contentVariants({ align }), className)}
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          visibility: pos ? "visible" : "hidden",
          ...style,
        }}
        {...props}
      />,
      document.body,
    );
  },
);
DropdownContent.displayName = "DropdownContent";

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, danger, onClick, ...props }, ref) => {
    const { setOpen } = useDropdown();
    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
          danger
            ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
            : "text-[var(--color-ink)] hover:bg-[var(--color-mist)]",
          className,
        )}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      />
    );
  },
);
DropdownItem.displayName = "DropdownItem";

const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-1 h-px bg-[var(--color-line)]", className)}
    {...props}
  />
));
DropdownSeparator.displayName = "DropdownSeparator";

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
};
