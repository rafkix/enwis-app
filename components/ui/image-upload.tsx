"use client";

import * as React from "react";
import { ImagePlus, Link2, RefreshCw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "./button";
import { Input } from "./input";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_STRING = "image/jpeg,image/png,image/webp";

interface ImageUploadProps {
  /** Existing image URL/path (e.g. from the server) — shown when no file is picked. */
  value?: string | null;
  /** Picked-but-not-yet-uploaded file, controlled by the parent. */
  file?: File | null;
  onFileChange?: (file: File | null) => void;
  onUrlChange?: (url: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  className?: string;
  hint?: string;
}

export function ImageUpload({
  value,
  file,
  onFileChange,
  onUrlChange,
  disabled,
  maxSizeMB = 5,
  className,
  hint,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlText, setUrlText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const preview = React.useMemo(() => {
    if (file) return { src: URL.createObjectURL(file), isFile: true as const };
    const resolved = resolveMediaUrl(value);
    if (resolved) return { src: resolved, isFile: false as const };
    return null;
  }, [file, value]);

  React.useEffect(() => {
    return () => {
      // Revoke the object URL created above once the preview changes/unmounts.
      if (preview?.isFile) URL.revokeObjectURL(preview.src);
    };
  }, [preview]);

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Faqat JPG, PNG yoki WEBP rasm yuklash mumkin");
      return;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`Rasm hajmi ${maxSizeMB} MB dan oshmasligi kerak`);
      return;
    }
    setError(null);
    setUrlText("");
    setShowUrlInput(false);
    onUrlChange?.("");
    onFileChange?.(f);
  };

  const openPicker = () => {
    if (disabled) return;
    setError(null);
    inputRef.current?.click();
  };

  const submitUrl = () => {
    const url = urlText.trim();
    if (!url) return;
    setError(null);
    setShowUrlInput(false);
    setUrlText("");
    onFileChange?.(null);
    onUrlChange?.(url);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-line)] bg-[var(--color-mist)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.src}
            alt="Muqova rasmi"
            className="h-44 w-full object-cover"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              {file ? (
                <p className="truncate text-sm text-[var(--color-ink)]">{file.name}</p>
              ) : (
                <p className="text-sm text-[var(--color-slate)]">Muqova rasmi</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={disabled}>
                <RefreshCw className="h-3.5 w-3.5" />
                O&apos;zgartirish
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  onFileChange?.(null);
                }}
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
                O&apos;chirish
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Rasm yuklash"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-2xl)] border-2 border-dashed px-6 py-10 text-center transition-all duration-200",
            dragActive
              ? "border-[var(--color-deep)] bg-[var(--color-volt)]/10"
              : "border-[var(--color-line)] bg-[var(--color-mist)]/40 hover:border-[var(--color-deep)]/40 hover:bg-[var(--color-mist)]",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-volt)]/15">
            <ImagePlus size={24} className="text-[var(--color-deep)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Muqova rasmini yuklang
            </p>
            <p className="mt-1 text-xs text-[var(--color-slate)]">
              JPG, PNG yoki WEBP · {maxSizeMB} MB gacha
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
            >
              Fayl tanlash
            </Button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput((p) => !p);
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[var(--color-deep)] transition-colors hover:bg-[var(--color-volt)]/15"
            >
              <Link2 size={14} />
              URL orqali qo&apos;shish
            </button>
          </div>
        </div>
      )}

      {showUrlInput && (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="https://..."
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitUrl();
            }}
          />
          <Button type="button" variant="primary" size="sm" onClick={submitUrl}>
            Qo&apos;shish
          </Button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="rounded-full p-2 text-[var(--color-slate)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-slate)]">{hint}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
