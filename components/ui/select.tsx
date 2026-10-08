"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";

/**
 * A fully custom-styled select. Native `<select>` renders its option
 * list via the OS/browser (can't be themed — no border radius, no
 * brand colors, no custom hover states, and it looks completely
 * different across Chrome/Safari/mobile). This component keeps the
 * exact same call-site API as the old native-select wrapper
 * (`value`, `onChange={(e) => ... e.target.value}`, plain `<option>`
 * children) so no other file needs to change, but renders its own
 * fully-styled dropdown panel on desktop and a touch-friendly bottom
 * sheet on mobile (< 768px, matches the rest of the app's mobile
 * breakpoint via useIsMobile()).
 */

interface ParsedOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== "option") return;
    const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
    options.push({
      value: String(props.value ?? ""),
      label: props.children,
      disabled: props.disabled,
    });
  });
  return options;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      children,
      className,
      placeholder = "Tanlang",
      disabled,
      name,
      id,
      "aria-label": ariaLabel,
    },
    forwardedRef,
  ) => {
    const options = React.useMemo(() => parseOptions(children), [children]);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? "",
    );
    const currentValue = isControlled ? value : internalValue;
    const selected = options.find((o) => o.value === currentValue);

    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [coords, setCoords] = React.useState<{
      top: number;
      left: number;
      width: number;
      openUp: boolean;
    } | null>(null);

    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    React.useEffect(() => setMounted(true), []);

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef)
          (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [forwardedRef],
    );

    const updatePosition = React.useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 260 && rect.top > spaceBelow;
      setCoords({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }, []);

    const openMenu = () => {
      if (disabled || options.length === 0) return;
      updatePosition();
      setOpen(true);
    };

    // Keep the desktop panel anchored to the trigger while it's open.
    React.useEffect(() => {
      if (!open || isMobile) return;
      updatePosition();
      const handle = () => updatePosition();
      window.addEventListener("scroll", handle, true);
      window.addEventListener("resize", handle);
      return () => {
        window.removeEventListener("scroll", handle, true);
        window.removeEventListener("resize", handle);
      };
    }, [open, isMobile, updatePosition]);

    // Click-outside / Escape to close.
    React.useEffect(() => {
      if (!open) return;
      const handlePointer = (e: MouseEvent) => {
        const target = e.target as Node;
        if (triggerRef.current?.contains(target)) return;
        if (panelRef.current?.contains(target)) return;
        setOpen(false);
      };
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", handlePointer);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("mousedown", handlePointer);
        document.removeEventListener("keydown", handleKey);
      };
    }, [open]);

    const selectValue = (v: string) => {
      if (!isControlled) setInternalValue(v);
      onChange?.({ target: { value: v } });
      setOpen(false);
    };

    const optionRow = (opt: ParsedOption, variant: "sheet" | "menu") => {
      const isSelected = opt.value === currentValue;
      return (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={isSelected}
          disabled={opt.disabled}
          onClick={() => selectValue(opt.value)}
          className={cn(
            "w-full flex items-center justify-between gap-3 text-left transition-colors disabled:opacity-40 disabled:pointer-events-none",
            variant === "sheet"
              ? "px-5 py-3.5 text-[15px] active:bg-[var(--color-mist)]"
              : "rounded-[calc(var(--radius-lg)-0.4rem)] px-3 py-2 text-sm hover:bg-[var(--color-mist)]",
            isSelected && "font-medium text-[var(--color-deep)] bg-[var(--color-volt)]/15",
          )}
        >
          <span className="truncate">{opt.label}</span>
          {isSelected && (
            <Check size={variant === "sheet" ? 17 : 14} className="shrink-0 text-[var(--color-deep)]" />
          )}
        </button>
      );
    };

    const menu = isMobile ? (
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <div
          className="absolute inset-0 bg-[var(--color-deep-900)]/40 animate-[var(--animate-sheet-backdrop)]"
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          role="listbox"
          className="relative w-full flex flex-col rounded-t-[var(--radius-2xl)] bg-white shadow-[var(--shadow-soft-lg)] max-h-[70vh] animate-[var(--animate-sheet-up)]"
          style={{ paddingBottom: "var(--tg-safe-bottom, 0px)" }}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1.5 w-10 rounded-full bg-[var(--color-line)]" />
          </div>
          <div className="overflow-y-auto py-1">
            {options.map((opt) => optionRow(opt, "sheet"))}
          </div>
        </div>
      </div>
    ) : (
      coords && (
        <div
          ref={panelRef}
          role="listbox"
          style={{
            position: "fixed",
            top: coords.openUp ? undefined : coords.top,
            bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
            left: coords.left,
            minWidth: coords.width,
          }}
          className="z-[100] max-h-72 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-1.5 shadow-[var(--shadow-soft-md)] animate-[var(--animate-dropdown-in)]"
        >
          {options.map((opt) => optionRow(opt, "menu"))}
        </div>
      )
    );

    return (
      <div className={cn("relative", className)}>
        <button
          ref={setRefs}
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => (open ? setOpen(false) : openMenu())}
          className={cn(
            "h-12 w-full flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border bg-white pl-4 pr-3 text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30",
            open ? "border-[var(--color-deep)]" : "border-[var(--color-line)]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span
            className={cn(
              "truncate text-[var(--color-ink)]",
              !selected && "text-[var(--color-slate-light)]",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-[var(--color-slate)] transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>

        {name && <input type="hidden" name={name} value={currentValue} readOnly />}

        {open && mounted && createPortal(menu, document.body)}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };