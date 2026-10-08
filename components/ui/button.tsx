import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] font-medium transition-all duration-300 ease-[var(--ease-editorial)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-volt)]",
  {
variants: {
        variant: {
          primary:
            "bg-[var(--color-volt)] text-white hover:bg-[var(--color-volt-light)] hover:shadow-[var(--shadow-volt-glow)] active:scale-[0.98]",
          dark: "bg-[var(--color-deep)] text-white hover:bg-[var(--color-deep-800)] active:scale-[0.98]",
          accent:
            "bg-[var(--color-accent)] text-[var(--color-ink)] hover:brightness-95 active:scale-[0.98]",
          outline:
            "border border-[var(--color-line)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-volt)] active:scale-[0.98]",
          ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-mist)]",
          destructive:
            "bg-[var(--color-danger)] text-white hover:brightness-90 active:scale-[0.98]",
        },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
