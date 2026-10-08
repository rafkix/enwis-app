"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface CalendarProps {
  value?: Date | null;
  onSelect?: (date: Date) => void;
  min?: Date;
  max?: Date;
  className?: string;
}

export function Calendar({ value, onSelect, min, max, className }: CalendarProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = React.useState<Date>(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const minDay = min ? startOfDay(min) : null;
  const maxDay = max ? startOfDay(max) : null;

  const firstWeekday = (view.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const goNext = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Oldingi oy"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          type="button"
          onClick={goNext}
          aria-label="Keyingi oy"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 pb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="flex h-8 items-center justify-center text-xs font-medium text-[var(--color-slate)]"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="h-9 w-9" />;
          const isSelected = !!value && isSameDay(cell, value);
          const isToday = isSameDay(cell, today);
          const isDisabled = !!((minDay && cell < minDay) || (maxDay && cell > maxDay));
          return (
            <button
              key={cell.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(cell)}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30",
                isSelected
                  ? "bg-[var(--color-deep)] font-semibold text-white shadow-[var(--shadow-soft-sm)]"
                  : isToday
                    ? "bg-[var(--color-volt)]/25 font-semibold text-[var(--color-deep-900)] hover:bg-[var(--color-volt)]/40"
                    : "font-medium text-[var(--color-ink)] hover:bg-[var(--color-mist)]",
                isDisabled && "pointer-events-none opacity-40",
              )}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
