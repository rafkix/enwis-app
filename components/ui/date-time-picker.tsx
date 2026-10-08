"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";

const MONTHS_SHORT = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Round-trips with <input type="datetime-local"> — local time, no offset.
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseValue(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplay(d: Date): string {
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DateTimePickerProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sana va vaqtni tanlang",
  disabled,
  min,
  max,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const [draft, setDraft] = React.useState<Date>(() => parseValue(value) ?? new Date());
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const selected = parseValue(value);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < panelHeight && rect.top - 8 > panelHeight;
    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - 320 - 8));
    setCoords({ top: openUp ? rect.top - panelHeight : rect.bottom + 6, left });
  }, []);

  const openPanel = () => {
    if (disabled) return;
    setDraft(parseValue(value) ?? new Date());
    updatePosition();
    setOpen(true);
  };

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
    const handleReposition = () => updatePosition();
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  const commit = (next: Date) => {
    setDraft(next);
    onChange?.(toLocalInput(next));
  };

  const minDate = min ? parseValue(min) : null;
  const maxDate = max ? parseValue(max) : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          "h-12 w-full flex items-center gap-2 rounded-[var(--radius-lg)] border bg-white px-4 text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30",
          open ? "border-[var(--color-deep)]" : "border-[var(--color-line)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <CalendarDays size={16} className="shrink-0 text-[var(--color-slate)]" />
        <span
          className={cn(
            "flex-1 truncate",
            selected ? "text-[var(--color-ink)]" : "text-[var(--color-slate-light)]",
          )}
        >
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Tozalash"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange?.(null);
              }
            }}
            className="rounded-full p-1 text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]"
          >
            <X size={14} />
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-[var(--color-slate)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[100] w-[20rem] rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-soft-lg)] animate-[var(--animate-dropdown-in)]"
            style={{ top: coords?.top ?? -9999, left: coords?.left ?? -9999, visibility: coords ? "visible" : "hidden" }}
          >
            <Calendar
              value={draft}
              min={minDate ?? undefined}
              max={maxDate ?? undefined}
              onSelect={(day) => {
                const next = new Date(
                  day.getFullYear(),
                  day.getMonth(),
                  day.getDate(),
                  draft.getHours(),
                  draft.getMinutes(),
                );
                commit(next);
              }}
            />

            {/* Time row */}
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-line)] pt-3">
              <span className="shrink-0 text-xs font-medium text-[var(--color-slate)]">Vaqt</span>
              <select
                value={draft.getHours()}
                onChange={(e) => {
                  const next = new Date(draft);
                  next.setHours(Number(e.target.value));
                  commit(next);
                }}
                aria-label="Soat"
                className="h-9 min-w-0 flex-1 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-2 text-sm text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {pad(h)}
                  </option>
                ))}
              </select>
              <span className="text-[var(--color-slate)]">:</span>
              <select
                value={draft.getMinutes()}
                onChange={(e) => {
                  const next = new Date(draft);
                  next.setMinutes(Number(e.target.value));
                  commit(next);
                }}
                aria-label="Daqiqa"
                className="h-9 min-w-0 flex-1 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-2 text-sm text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30"
              >
                {Array.from({ length: 60 }, (_, m) => (
                  <option key={m} value={m}>
                    {pad(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = new Date();
                  next.setSeconds(0, 0);
                  commit(next);
                }}
                className="rounded-[var(--radius-lg)] px-3 py-1.5 text-sm font-medium text-[var(--color-deep)] transition-colors hover:bg-[var(--color-volt)]/15"
              >
                Hozir
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange?.(null);
                  setOpen(false);
                }}
                className="rounded-[var(--radius-lg)] px-3 py-1.5 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-light)]"
              >
                Tozalash
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
