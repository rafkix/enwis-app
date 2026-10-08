"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionTab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: string | number;
}

interface SectionTabsProps {
  sections: SectionTab[];
  defaultOpen?: string[];
  className?: string;
  allowMultiple?: boolean;
  compact?: boolean;
}

export function SectionTabs({
  sections,
  defaultOpen = [],
  className,
  allowMultiple = true,
  compact = false,
}: SectionTabsProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(defaultOpen.length > 0 ? defaultOpen : [sections[0]?.id])
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  const isOpen = (id: string) => openSections.has(id);

  return (
    <div className={cn("space-y-3", className)}>
      {sections.map((section) => {
        const open = isOpen(section.id);
        return (
          <div
            key={section.id}
            className={cn(
              "rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)] overflow-hidden transition-all duration-200",
              open ? "shadow-[var(--shadow-soft-md)]" : ""
            )}
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 p-4 text-left transition-colors",
                open
                  ? "bg-[var(--color-deep)]/5 border-b border-[var(--color-line)]"
                  : "hover:bg-[var(--color-mist)]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {section.icon && (
                  <div className={cn(
                    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                    open ? "bg-[var(--color-deep)] text-white" : "bg-[var(--color-volt)]/15 text-[var(--color-deep)]"
                  )}>
                    {section.icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className={cn(
                    "font-medium truncate",
                    open ? "text-[var(--color-deep)]" : "text-[var(--color-ink)]"
                  )}>
                    {section.title}
                  </h3>
                  {section.badge && (
                    <span className="text-xs text-[var(--color-slate-light)]">
                      {section.badge} ta
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {open && !compact && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id);
                    }}
                  >
                    <X size={14} />
                  </Button>
                )}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  open
                    ? "border-[var(--color-deep)] bg-[var(--color-deep)]"
                    : "border-[var(--color-line)]"
                )}>
                  {open ? (
                    <ChevronUp size={10} className="text-white" />
                  ) : (
                    <ChevronDown size={10} className="text-[var(--color-slate)]" />
                  )}
                </div>
              </div>
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}
              style={{
                maxHeight: open ? "500px" : "0",
              }}
            >
              <div className="p-4 pt-2 border-t border-[var(--color-line)] bg-[var(--color-mist)]/30">
                {section.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompactSectionTabs({
  sections,
  className,
}: {
  sections: SectionTab[];
  className?: string;
}) {
  return (
    <SectionTabs
      sections={sections}
      compact
      allowMultiple={true}
      defaultOpen={sections.map((s) => s.id)}
      className={cn("space-y-2", className)}
    />
  );
}