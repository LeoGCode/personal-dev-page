import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";
import { getAllProjectSlugs } from "@/content/projects";
import { routing } from "@/lib/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * Dynamic sitemap generated at build time by Next.js.
 *
 * Replaces `next-sitemap` so every URL always uses the real domain
 * (no more localhost leaking into production) and hreflang alternates
 * are correct — including `x-default`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const { locales, defaultLocale } = routing;
  const entries: MetadataRoute.Sitemap = [];

  /** Build `alternates.languages` for a given path (without locale prefix). */
  function alternatesFor(path: string) {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${SITE_URL}/${locale}${path}`;
    }
    languages["x-default"] = `${SITE_URL}/${defaultLocale}${path}`;
    return { languages };
  }

  // ── Static pages ──────────────────────────────────────────────
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.8, changeFrequency: "daily" },
    { path: "/projects", priority: 0.8, changeFrequency: "weekly" },
    { path: "/collaborate", priority: 0.7, changeFrequency: "monthly" },
  ];

  for (const route of staticRoutes) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: alternatesFor(route.path),
      });
    }
  }

  // ── Blog posts ────────────────────────────────────────────────
  // Use the default locale to get the canonical list of slugs,
  // then create entries for every locale that has that post.
  const defaultPosts = getBlogPosts(defaultLocale);

  for (const post of defaultPosts) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternatesFor(`/blog/${post.slug}`),
      });
    }
  }

  // ── Project pages ─────────────────────────────────────────────
  for (const slug of getAllProjectSlugs()) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/projects/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: alternatesFor(`/projects/${slug}`),
      });
    }
  }

  return entries;
}
