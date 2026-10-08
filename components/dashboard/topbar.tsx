"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { testService } from "@/services/test.service";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { Search, X, FileText, ListChecks } from "lucide-react";

interface SearchResult {
  type: "test";
  id: string;
  title: string;
  subtitle?: string;
}

/**
 * Desktop/tablet-only top navigation bar: Cmd/Ctrl+K search, notification
 * bell, profile. Only ever rendered by <DesktopLayout> — mobile web and
 * Telegram render their own dedicated headers instead (see
 * components/dashboard/mobile-header.tsx and telegram-header.tsx) so this
 * component never has to branch on environment.
 */
export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const tests = await testService
          .list({ search: searchQuery.trim(), limit: 5 })
          .catch(() => ({ items: [] as { id: string; title: string; status: string }[] }));
        const results: SearchResult[] = tests.items.map((t) => ({
          type: "test" as const,
          id: t.id,
          title: t.title,
          subtitle: t.status,
        }));
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/tests/${result.id}`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "test": return ListChecks;
      default: return FileText;
    }
  };

  return (
    <header className="h-[72px] border-b border-[var(--color-line)] bg-white/80 backdrop-blur-xl flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-30">
      <div className="min-w-0 flex-1 sm:flex-none pl-12 lg:pl-0" ref={searchRef}>
        {/* Mobilda faqat lupa ikonasi — bosilganda pastda to'liq kenglikdagi qidiruv paneli ochiladi.
            Sabab: sm:w-64 qidiruv input + yon tugmalar kichik ekranda (< ~380px) sig'may qolardi.
            (Bu holat faqat tablet oralig'ida ko'rinadi — <768px endi MobileHeader ishlatadi.) */}
        <button
          onClick={() => {
            setSearchOpen((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="sm:hidden w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-slate)] hover:text-[var(--color-ink)] hover:bg-[var(--color-mist)] transition-all"
          aria-label="Qidiruv"
        >
          <Search size={18} />
        </button>

        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="w-64 h-10 pl-10 pr-4 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-mist)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep)]/20 focus:border-[var(--color-deep)] transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searchOpen && (
          <div className="sm:hidden fixed left-0 right-0 top-[72px] z-40 border-b border-[var(--color-line)] bg-white p-3 shadow-[var(--shadow-soft-md)]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)]" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-mist)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-slate-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep)]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-slate-light)] hover:text-[var(--color-ink)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {searchOpen && searchQuery.trim() && (
          <div className="absolute top-[72px] left-0 w-[min(24rem,calc(100vw-1.5rem))] sm:max-w-md bg-white rounded-[var(--radius-xl)] border border-[var(--color-line)] shadow-[var(--shadow-soft-lg)] z-50 max-h-[400px] overflow-auto">
            {searching ? (
              <div className="p-4 text-center text-sm text-[var(--color-slate)]">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--color-slate)]">
                No results found
              </div>
            ) : (
              <div className="p-2">
                {searchResults.map((result) => {
                  const Icon = getIcon(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-mist)] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--color-mist)] flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-[var(--color-deep)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-ink)] text-sm truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-[var(--color-slate-light)] truncate">{result.subtitle}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationBell />

        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 sm:gap-3 hover:bg-[var(--color-mist)] rounded-[var(--radius-lg)] px-1.5 sm:px-2 py-1 transition-colors"
        >
          <Avatar
            size="sm"
            src={user?.avatar}
            fallback={user?.full_name || ""}
            className="ring-2 ring-[var(--color-deep)]/20 shrink-0"
          />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-[var(--color-ink)] leading-tight">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-[var(--color-slate)]">
              {user?.roles?.[0] || "user"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
