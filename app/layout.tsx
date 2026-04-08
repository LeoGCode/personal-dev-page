import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getLocale } from "next-intl/server";
import { PostHogProvider } from "@/components/posthog-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { ThemeInit } from "@/components/theme-init";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Full-Stack Engineer`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Full-Stack Engineer who ships products end-to-end and leverages AI, agents, and LLMs to make them 10x more powerful.",
  metadataBase: new URL(SITE_URL),
  keywords: [
    "full-stack engineer",
    "software engineer",
    "AI integration",
    "LLM",
    "agentic workflows",
    "product builder",
    "Next.js",
    "TypeScript",
    "React",
    "Python",
    "FastAPI",
    "Docker",
  ],
  openGraph: {
    title: `${SITE_NAME} — Full-Stack Engineer`,
    description:
      "Full-Stack Engineer who ships products end-to-end and leverages AI, agents, and LLMs to make them 10x more powerful.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Full-Stack Engineer`,
    description:
      "Full-Stack Engineer who ships products end-to-end and leverages AI, agents, and LLMs to make them 10x more powerful.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f0f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/scripts/theme-init.js" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeInit />
        <CursorGlow />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
