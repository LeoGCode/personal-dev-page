import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { cache } from "react";
import { z } from "zod";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
});

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  locale: string;
  readingTime: string;
  content: string;
}

function parseFrontmatter(data: Record<string, unknown>, slug: string) {
  const result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    console.warn(`Invalid frontmatter in ${slug}:`, result.error.flatten());
    return {
      title: String(data.title ?? slug),
      date: String(data.date ?? ""),
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      description: String(data.description ?? ""),
    };
  }
  return result.data;
}

export function getBlogPosts(locale: string): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(`.${locale}.mdx`));

  return files
    .map((filename) => {
      const filePath = path.join(BLOG_DIR, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);
      const stats = readingTime(content);
      const slug = filename.replace(`.${locale}.mdx`, "");
      const frontmatter = parseFrontmatter(data, slug);

      return {
        slug,
        ...frontmatter,
        locale,
        readingTime: stats.text,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getBlogPost = cache(function getBlogPost(slug: string, locale: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.${locale}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);
  const frontmatter = parseFrontmatter(data, slug);

  return {
    slug,
    ...frontmatter,
    locale,
    readingTime: stats.text,
    content,
  };
});
