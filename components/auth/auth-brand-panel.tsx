import { Logo } from "@/components/ui/logo";

type Props = {
  title: string;
  description: string;
};

// Shared brand panel used by /login (right side) and /register (left side)
// so both auth pages carry the exact same visual identity — only the
// column order differs, which the pages control via CSS order classes.
export function AuthBrandPanel({ title, description }: Props) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[var(--color-deep)] p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full bg-[var(--color-volt)]/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[380px] w-[380px] rounded-full bg-[var(--color-volt)]/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <div className="relative z-10">
        <Logo dark />
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight text-white text-balance">
          {title}
        </h2>
        <p className="mt-4 text-sm text-white/60 leading-relaxed">
          {description}
        </p>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        © {new Date().getFullYear()} Enwis. Barcha huquqlar himoyalangan.
      </p>
    </div>
  );
}
