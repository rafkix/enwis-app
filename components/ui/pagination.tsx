"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Sahifalar"
      className={cn("flex items-center gap-1 max-w-full overflow-x-auto", className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`dots-${i}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-slate-light)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-200",
              page === currentPage
                ? "bg-[var(--color-deep)] text-white shadow-[var(--shadow-soft-sm)]"
                : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export { Pagination };
