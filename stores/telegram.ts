"use client";

import { create } from "zustand";

interface TelegramState {
  // true faqat window.Telegram.WebApp mavjud bo'lganda (ya'ni ilova
  // haqiqatan Telegram ichida — Mini App sifatida — ochilgan bo'lsa).
  // Oddiy brauzerda doim false bo'lib qoladi.
  inTelegram: boolean;
  setInTelegram: (value: boolean) => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
  inTelegram: false,
  setInTelegram: (value) => set({ inTelegram: value }),
}));
