import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "min-h-[80px] w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-slate-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-deep)]/30 focus-visible:border-[var(--color-deep)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
