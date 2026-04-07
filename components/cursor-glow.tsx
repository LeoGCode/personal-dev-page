"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── constants ── */
const TRAIL_LENGTH = 12;
const LERP = 0.15;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* ── types ── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Canvas-based custom cursor with five layered effects:
 *
 *  1. Fluid trailing ribbon – color-shifting emerald → teal gradient
 *  2. Magnetic outer ring   – lerp-interpolated, expands on hover
 *  3. Snap dot              – locked to real cursor for precision
 *  4. Click particles       – burst outward with physics decay
 *  5. Expanding ripple      – ring on click
 *  6. Hover label           – shows `data-cursor="…"` text above the ring
 *
 * The native cursor is hidden via a `.cursor-none` class on `<html>`.
 * Everything is `pointer-events: none` and `z-[9999]` — clicks pass through.
 * Automatically disabled on touch-only devices.
 */
export function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<Point>({ x: 0, y: 0 });
  const cursor = useRef<Point>({ x: 0, y: 0 });
  const trail = useRef<Point[]>([]);
  const hovering = useRef<string | null>(null);
  const raf = useRef(0);
  const particles = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const initialized = useRef(false);

  /* ── click burst ── */
  const spawnParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 2 + Math.random() * 3,
        hue: 150 + Math.random() * 60, // emerald → teal range
      });
    }
  }, []);

  /* ── main loop ── */
  useEffect(() => {
    // Bail on touch-only devices
    if (!window.matchMedia("(hover: hover)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hide native cursor
    document.documentElement.classList.add("cursor-none");

    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();

    // Resolve the project's mono font for hover labels
    let monoFont = "monospace";
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-mono")
      .trim();
    if (raw) monoFont = `${raw}, monospace`;

    /* ── event handlers ── */
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      // Seed lerp cursor on first move to avoid animate-from-origin
      if (!initialized.current) {
        cursor.current = { x: e.clientX, y: e.clientY };
        initialized.current = true;
      }
    };

    const onClick = (e: MouseEvent) => {
      spawnParticles(e.clientX, e.clientY);
      ripples.current.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
        alpha: 1,
      });
    };

    const onOver = (e: MouseEvent) => {
      const tag = (e.target as Element)?.closest?.("[data-cursor]");
      hovering.current = tag
        ? (tag as HTMLElement).dataset.cursor ?? null
        : null;
    };

    const onOut = () => {
      hovering.current = null;
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    /* ── animation frame ── */
    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Smooth follow
      cursor.current.x = lerp(cursor.current.x, mouse.current.x, LERP);
      cursor.current.y = lerp(cursor.current.y, mouse.current.y, LERP);

      // Build trail
      trail.current.unshift({
        x: cursor.current.x,
        y: cursor.current.y,
      });
      if (trail.current.length > TRAIL_LENGTH) trail.current.pop();

      /* ── 1 · trailing ribbon ── */
      for (let i = trail.current.length - 1; i >= 1; i--) {
        const t = 1 - i / trail.current.length;
        const p = trail.current[i];
        const prev = trail.current[i - 1];

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(prev.x, prev.y);
        ctx.strokeStyle = `hsla(${155 + i * 5}, 80%, 55%, ${t * 0.45})`;
        ctx.lineWidth = 3 + t * 14;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      /* ── 2 · magnetic ring ── */
      const isHover = hovering.current !== null;
      const ringR = isHover ? 28 : 20;
      const ringA = isHover ? 0.55 : 0.3;

      ctx.beginPath();
      ctx.arc(cursor.current.x, cursor.current.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(160, 75%, 50%, ${ringA})`;
      ctx.lineWidth = isHover ? 2.5 : 1.5;
      ctx.stroke();

      /* ── 3 · snap dot ── */
      ctx.beginPath();
      ctx.arc(
        mouse.current.x,
        mouse.current.y,
        isHover ? 5 : 3.5,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "hsla(158, 80%, 65%, 0.9)";
      ctx.fill();

      /* ── ambient glow ── */
      const grd = ctx.createRadialGradient(
        cursor.current.x,
        cursor.current.y,
        0,
        cursor.current.x,
        cursor.current.y,
        60,
      );
      grd.addColorStop(0, "hsla(160, 80%, 55%, 0.1)");
      grd.addColorStop(1, "hsla(160, 80%, 55%, 0)");
      ctx.beginPath();
      ctx.arc(cursor.current.x, cursor.current.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* ── 4 · particles ── */
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.025;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 75%, 55%, ${p.life * 0.65})`;
        ctx.fill();
        return true;
      });

      /* ── 5 · click ripples ── */
      ripples.current = ripples.current.filter((rip) => {
        rip.r += 3;
        rip.alpha -= 0.03;
        if (rip.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(160, 75%, 55%, ${rip.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return true;
      });

      /* ── 6 · hover label ── */
      if (hovering.current) {
        ctx.font = `600 11px ${monoFont}`;
        ctx.fillStyle = "hsla(158, 70%, 60%, 0.85)";
        ctx.textAlign = "center";
        ctx.fillText(
          hovering.current.toUpperCase(),
          cursor.current.x,
          cursor.current.y - ringR - 10,
        );
      }

      raf.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      document.documentElement.classList.remove("cursor-none");
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf.current);
    };
  }, [spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
