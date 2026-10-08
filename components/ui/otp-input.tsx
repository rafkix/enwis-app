"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d*$/.test(digit)) return;

      const newValue = value.split("");
      while (newValue.length < length) newValue.push("");
      newValue[index] = digit.slice(-1);
      const result = newValue.join("").slice(0, length);
      onChange(result);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }

      if (result.length === length && onComplete) {
        onComplete(result);
      }
    },
    [value, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace") {
        if (!value[index] && index > 0) {
          const newValue = value.split("");
          newValue[index - 1] = "";
          onChange(newValue.join(""));
          inputRefs.current[index - 1]?.focus();
          setFocusedIndex(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    },
    [value, length, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);

      if (pasted.length === length && onComplete) {
        onComplete(pasted);
      }
    },
    [length, onChange]
  );

  return (
    <div className="flex gap-1.5 sm:gap-3 justify-center max-w-full overflow-x-auto px-1 py-1">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(i)}
          className={cn(
            "w-9 h-11 sm:w-12 sm:h-14 shrink-0 text-center text-lg sm:text-xl font-medium rounded-[var(--radius-lg)] border bg-white text-[var(--color-ink)] transition-all duration-200 focus:outline-none focus:ring-2",
            error
              ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]/30"
              : focusedIndex === i
                ? "border-[var(--color-deep)] ring-2 ring-[var(--color-deep)]/20"
                : "border-[var(--color-line)] focus:border-[var(--color-deep)] focus:ring-[var(--color-deep)]/20",
            disabled && "opacity-50 cursor-not-allowed bg-[var(--color-mist)]"
          )}
          aria-label={`Raqam ${i + 1}`}
        />
      ))}
    </div>
  );
}
