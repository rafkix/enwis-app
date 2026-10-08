import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-mist)] font-[family-name:var(--font-display)] font-semibold text-[var(--color-deep)]",
  {
    variants: {
      size: {
        xs: "h-7 w-7 text-[0.65rem]",
        sm: "h-9 w-9 text-xs",
        md: "h-11 w-11 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const initials = getInitials(fallback);
    const resolvedSrc = resolveMediaUrl(src);
    const showImage = resolvedSrc && !imgError;

    React.useEffect(() => {
      setImgError(false);
    }, [resolvedSrc]);

    return (
      <div ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
        {showImage ? (
          <Image
            src={resolvedSrc}
            alt={alt || fallback || ""}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
