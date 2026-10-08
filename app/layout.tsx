import type { Metadata, Viewport } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { TelegramWebAppAdapter } from "@/components/telegram-webapp-adapter";
import { PwaManager } from "@/components/pwa-manager";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Enwis - Examination Platform",
  description: "AI-powered IELTS and CEFR preparation platform",
  metadataBase: new URL("https://enwis.uz"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
      },
    ],
  },
  manifest: "/site.webmanifest",
  // iOS Safari "Add to Home Screen" doesn't read manifest.json for these —
  // needs its own apple-mobile-web-app-* meta tags (see RESPONSIVE_TELEGRAM_PWA_PROMPTS.md, 21-PROMPT item 3).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Enwis",
  },
  openGraph: {
    title: "Enwis - Examination Platform",
    description: "AI-powered IELTS and CEFR preparation platform",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} ${plexMono.variable} h-full bg-canvas antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <TelegramWebAppAdapter />
        <PwaManager />
        {children}
      </body>
    </html>
  );
}
