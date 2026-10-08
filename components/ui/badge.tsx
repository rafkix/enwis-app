import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-mist)] text-[var(--color-deep)] border border-[var(--color-line)]",
        primary: "bg-[var(--color-volt)]/15 text-[var(--color-deep)] border border-[var(--color-volt)]/30",
        success:
          "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]/30",
        warning:
          "bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        danger:
          "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger)]/30",
        info: "bg-[var(--color-info-light)] text-[var(--color-info)] border border-[var(--color-info)]/30",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent)]",
        dark: "bg-[var(--color-deep)] text-white border border-[var(--color-deep)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
