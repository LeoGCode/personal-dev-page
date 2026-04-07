"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { usePathname } from "next/navigation";

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

export function BlogReadingProgress() {
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001,
	});
	const posthog = usePostHog();
	const pathname = usePathname();
	const firedMilestones = useRef(new Set<number>());

	useEffect(() => {
		const unsubscribe = scrollYProgress.on("change", (value) => {
			for (const milestone of SCROLL_MILESTONES) {
				if (
					value >= milestone / 100 &&
					!firedMilestones.current.has(milestone)
				) {
					firedMilestones.current.add(milestone);
					posthog?.capture("blog_scroll_depth", {
						depth: milestone,
						path: pathname,
					});
				}
			}
		});

		return () => unsubscribe();
	}, [scrollYProgress, posthog, pathname]);

	return (
		<motion.div
			role="progressbar"
			aria-label="Reading progress"
			aria-valuemin={0}
			aria-valuemax={100}
			className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-primary"
			style={{ scaleX }}
		/>
	);
}
