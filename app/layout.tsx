import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

const CursorGlow = dynamic(
  () => import("@/components/cursor-glow").then((m) => m.CursorGlow),
  { ssr: false },
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Leonel — Full-Stack Engineer",
    template: "%s | Leonel",
  },
  description:
    "Full-Stack Engineer who ships products end-to-end and leverages AI, agents, and LLMs to make them 10x more powerful.",
  metadataBase: new URL(siteUrl),
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
    title: "Leonel — Full-Stack Engineer",
    description:
      "Full-Stack Engineer who ships products end-to-end and leverages AI, agents, and LLMs to make them 10x more powerful.",
    url: siteUrl,
    siteName: "Leonel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonel — Full-Stack Engineer",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light")return;document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <CursorGlow />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
