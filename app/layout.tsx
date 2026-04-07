import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

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
    default: "Leonel — Software Engineer",
    template: "%s | Leonel",
  },
  description:
    "Personal developer portfolio and collaboration hub. Let's build something together.",
  metadataBase: new URL(siteUrl),
  keywords: [
    "software engineer",
    "full-stack developer",
    "web development",
    "portfolio",
    "collaboration",
    "Next.js",
    "TypeScript",
    "React",
  ],
  openGraph: {
    title: "Leonel — Software Engineer",
    description:
      "Personal developer portfolio and collaboration hub. Let's build something together.",
    url: siteUrl,
    siteName: "Leonel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonel — Software Engineer",
    description:
      "Personal developer portfolio and collaboration hub. Let's build something together.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light")return;document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
