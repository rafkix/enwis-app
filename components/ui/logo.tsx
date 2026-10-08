import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md";
  href?: string;
  showText?: boolean;
  className?: string;
  logoSrc?: string;
  // Dark sidebars/topbars need light text — the icon itself doesn't need
  // to change, only the wordmark next to it.
  dark?: boolean;
}

export function Logo({
  size = "md",
  href = "/",
  showText = true,
  className = "",
  logoSrc = "/favicon.ico",
  dark = false,
}: LogoProps) {
  const iconPx = size === "sm" ? 32 : 40;
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  const icon = (
    <Image
      src={logoSrc}
      alt="Enwis"
      width={iconPx}
      height={iconPx}
      className="flex-shrink-0"
      priority
    />
  );

  const text = showText && (
    <span
      className={`font-[var(--font-display)] ${textSize} font-bold ${dark ? "text-white" : "text-[var(--color-ink)]"} tracking-tight`}
    >
      Enwis
    </span>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      {text}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
