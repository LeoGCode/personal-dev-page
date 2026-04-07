import { compile, run } from "@mdx-js/mdx";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import { BlogArticleReveal, BlogHeaderMotion } from "@/components/blog-header";
import { BlogReadingProgress } from "@/components/blog-reading-progress";
import { Badge } from "@/components/ui/badge";
import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";

export async function generateStaticParams() {
	const params: { locale: string; slug: string }[] = [];

	for (const locale of routing.locales) {
		const posts = getBlogPosts(locale);
		for (const post of posts) {
			params.push({ locale, slug: post.slug });
		}
	}

	return params;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
	const { locale, slug } = await params;
	const post = getBlogPost(slug, locale);

	if (!post) {
		return { title: "Not Found" };
	}

	return {
		title: post.title,
		description: post.description,
	};
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("blog");
	const post = getBlogPost(slug, locale);

	if (!post) {
		notFound();
	}

	const code = await compile(post.content, {
		outputFormat: "function-body",
		rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
	});

	const { default: MDXContent } = await run(String(code), {
		...runtime,
		baseUrl: import.meta.url,
	});

	return (
		<>
			<Suspense>
				<BlogReadingProgress />
			</Suspense>

			<section className="px-4 py-16">
				<div className="mx-auto max-w-3xl">
					{/* Back navigation */}
					<BlogHeaderMotion index={0}>
						<Link
							href="/blog"
							className="group mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
						>
							<ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
							{t("back")}
						</Link>
					</BlogHeaderMotion>

					{/* Header */}
					<header className="mb-10">
						<BlogHeaderMotion index={1}>
							<h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
								{post.title}
							</h1>
						</BlogHeaderMotion>

						{post.description && (
							<BlogHeaderMotion index={2}>
								<p className="mt-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">
									{post.description}
								</p>
							</BlogHeaderMotion>
						)}

						<BlogHeaderMotion index={3}>
							<div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
								<span className="inline-flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
									{new Date(post.date).toLocaleDateString(locale, {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
									{post.readingTime}
								</span>
							</div>
						</BlogHeaderMotion>

						<BlogHeaderMotion index={4}>
							<div className="mt-4 flex flex-wrap gap-2">
								{post.tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="font-mono text-xs"
									>
										{tag}
									</Badge>
								))}
							</div>
						</BlogHeaderMotion>

						{/* Decorative separator */}
						<BlogHeaderMotion index={5}>
							<div className="mt-10 flex items-center gap-4">
								<div className="h-px flex-1 bg-border" />
								<div className="h-1.5 w-1.5 rounded-full bg-primary" />
								<div className="h-px flex-1 bg-border" />
							</div>
						</BlogHeaderMotion>
					</header>

					{/* Article content */}
					<BlogArticleReveal>
						<article className="blog-prose prose dark:prose-invert max-w-none prose-headings:font-mono prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 prose-pre:rounded-lg prose-pre:border prose-pre:border-border">
							<MDXContent />
						</article>
					</BlogArticleReveal>
				</div>
			</section>
		</>
	);
}
