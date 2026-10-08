import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white px-4 text-sm text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-slate-light)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-volt)]/15 focus-visible:border-[var(--color-volt)] aria-[invalid=true]:border-[var(--color-danger)] disabled:cursor-not-allowed disabled:bg-[var(--color-mist)] disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
