import type { NextConfig } from "next";

// ngrok bepul tarifda bir vaqtda faqat bitta ochiq endpoint (tunnel)ga ruxsat
// beradi (ERR_NGROK_334 — ikkinchisi ochilganda). Shu sabab backend uchun
// alohida tunnel ochish o'rniga, Next.js dev-serverning o'zi /api so'rovlarini
// localhost:8000'dagi backendga proksi qiladi — Telegram/brauzer faqat BITTA
// ngrok manzilini (frontend) ko'radi. Bonus: bu cross-site cookie/CORS
// muammosini ham butunlay yo'q qiladi, chunki brauzer nuqtai nazaridan
// so'rov endi HAR DOIM bir xil origin'ga ketadi.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:8000";

const nextConfig: NextConfig = {
  // "X-Powered-By exposes: Next.js" topilmasini yopadi — texnologiya
  // fingerprint'ini kamaytiradi.
  poweredByHeader: false,

  // Dev-server "boshqa origin'dan kelgan so'rov" (masalan ngrok/cloudflared
  // tunnel orqali Telegramdan ochilganda) so'rovlarini xavfsizlik uchun
  // bloklaydi. Telegram Mini App tunnel orqali test qilinganda shu domenlarni
  // ruxsat berish kerak — aks holda Server Actions/route handler chaqirilganda
  // "Blocked cross-origin request" xatosi chiqadi. Faqat dev rejimida ishlaydi,
  // productionda ta'sir qilmaydi.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.trycloudflare.com",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
      // NOTE: /uploads, /media, /static rewrites were removed — user
      // media (avatars, uploads) now resolves directly to the API
      // origin in lib/media.ts instead of relying on this proxy, which
      // silently broke in production whenever BACKEND_ORIGIN wasn't set
      // (falls back to http://localhost:8000). <img>/<Image> requests
      // aren't subject to CORS the way fetch() is, so there's no
      // same-origin requirement for these files the way there is for
      // /api (which needs cookies to flow, hence still proxied above).
    ];
  },
};

export default nextConfig;