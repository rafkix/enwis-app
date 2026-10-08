import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Plain <a target="_blank"> / window.open() can misbehave inside the
// Telegram Mini App WebView (silently no-ops or opens a broken in-app
// browser depending on client/platform) — external links must go through
// Telegram.WebApp.openLink() when running inside Telegram, and fall back
// to a normal new-tab open everywhere else.
// (RESPONSIVE_TELEGRAM_PWA_PROMPTS.md, 20-PROMPT item 7)
export function openExternalLink(url: string) {
  const tg = window.Telegram?.WebApp;
  if (tg?.initData && tg.openLink) {
    tg.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

// The backend's Question model has no dedicated image field or attachment
// upload endpoint, so "image" type questions embed the image URL as the
// first line of `description`. This pulls it back out for display.
const IMAGE_URL_RE = /^(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg))(?:\s*\n\n?([\s\S]*))?$/i;

export function extractQuestionImage(description: string | null | undefined): {
  imageUrl: string | null;
  text: string;
} {
  if (!description) return { imageUrl: null, text: "" };
  const match = description.match(IMAGE_URL_RE);
  if (match) return { imageUrl: match[1], text: match[2] || "" };
  return { imageUrl: null, text: description };
}
