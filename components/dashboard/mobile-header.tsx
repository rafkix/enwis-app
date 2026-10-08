"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { testService } from "@/services/test.service";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
}

/**
 * Mobile-browser header (<768px, outside Telegram). Deliberately its own
 * component rather than a squeezed-down <Topbar /> — no keyboard-shortcut
 * search bar, no sidebar-hamburger spacing, just a compact full-width bar
 * sized for one-handed/touch use with safe-area padding for the notch.
 */
export function MobileHeader() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const tests = await testService
          .list({ search: query.trim(), limit: 5 })
          .catch(() => ({ items: [] as { id: string; title: string; status: string }[] }));
        setResults(tests.items.map((t) => ({ id: t.id, title: t.title, subtitle: t.status })));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleSelect = (id: string) => {
    closeSearch();
    router.push(`/tests/${id}`);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 h-14 bg-white/90 backdrop-blur-xl border-b border-[var(--color-line)]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Logo size="sm" showText />

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={openSearch}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-slate)] active:bg-[var(--color-mist)] transition-colors"
            aria-label="Qidiruv"
          >
            <Search size={20} />
          </button>

          <NotificationBell compact />

          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            aria-label="Profil"
          >
            <Avatar
              size="xs"
              src={user?.avatar}
              fallback={user?.full_name || ""}
              className="ring-2 ring-[var(--color-deep)]/20"
            />
          </button>
        </div>
      </header>

      {/* Full-width search overlay — a squeezed inline bar doesn't fit next
          to the logo/bell/avatar on narrow screens, so it takes over the
          header row entirely while open instead. */}
      {searchOpen && (
        <div
          className="fixed inset-x-0 top-0 z-50 bg-white border-b border-[var(--color-line)] shadow-[var(--shadow-soft-md)]"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex items-center gap-2 px-3 h-14">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full h-10 pl-10 pr-4 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-mist)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep)]/20"
              />
            </div>
            <button
              onClick={closeSearch}
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[var(--color-slate)] active:bg-[var(--color-mist)]"
              aria-label="Yopish"
            >
              <X size={20} />
            </button>
          </div>

          {query.trim() && (
            <div className="max-h-[60vh] overflow-y-auto border-t border-[var(--color-line)]">
              {searching ? (
                <div className="p-4 text-center text-sm text-[var(--color-slate)]">Qidirilmoqda...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--color-slate)]">Natija topilmadi</div>
              ) : (
                <div className="p-2">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r.id)}
                      className="w-full flex flex-col items-start gap-0.5 p-3 rounded-[var(--radius-lg)] active:bg-[var(--color-mist)] transition-colors text-left"
                    >
                      <span className="font-medium text-[var(--color-ink)] text-sm truncate w-full">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-xs text-[var(--color-slate-light)]">{r.subtitle}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
