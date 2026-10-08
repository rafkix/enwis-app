import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-line)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
