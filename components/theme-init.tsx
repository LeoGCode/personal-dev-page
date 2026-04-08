"use client";

import { useEffect } from "react";

/**
 * Syncs the theme from localStorage to the DOM on every client-side navigation.
 *
 * The inline <script> in <head> handles the initial SSR render (prevents FOUC),
 * but Next.js 16 does not re-execute inline scripts on client navigations.
 * This component fills that gap.
 */
export function ThemeInit() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const theme = stored === "light" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  }, []);

  return null;
}
