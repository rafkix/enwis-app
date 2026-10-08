import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-lg)] border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-mist)] border-[var(--color-line)] text-[var(--color-ink)]",
        success:
          "bg-[var(--color-success-light)] border-[var(--color-success)]/30 text-[var(--color-success)]",
        warning:
          "bg-[var(--color-warning-light)] border-[var(--color-warning)]/30 text-[var(--color-warning)]",
        danger:
          "bg-[var(--color-danger-light)] border-[var(--color-danger)]/30 text-[var(--color-danger)]",
        info: "bg-[var(--color-info-light)] border-[var(--color-info)]/30 text-[var(--color-info)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
