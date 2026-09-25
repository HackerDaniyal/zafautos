"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DRIVE_ANIMATION_MS = 800;

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function BackToTopCar() {
  const [isHovered, setIsHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const driveRafRef = useRef<number>(0);
  const driveStartRef = useRef(0);
  const containerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 400;
        const isAnimating = el.dataset.driving === "1";
        if (!isAnimating) {
          el.style.opacity = scrolled ? "1" : "0";
          el.style.pointerEvents = scrolled ? "auto" : "none";
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = useCallback(() => {
    const el = containerRef.current;
    if (!el || el.dataset.driving === "1") return;

    if (isReducedMotion) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    el.dataset.driving = "1";

    const animate = (now: number) => {
      if (!driveStartRef.current) driveStartRef.current = now;
      const elapsed = now - driveStartRef.current;
      const raw = Math.min(1, elapsed / DRIVE_ANIMATION_MS);
      const ty = -easeInCubic(raw) * 110;
      const s = 1 + easeOutQuad(raw) * 0.15;
      const b = easeInCubic(raw) * 4;
      el.style.transform = `translateY(${ty}vh) scale(${s})`;
      el.style.filter = b > 0.01 ? `blur(${b}px)` : "";

      if (raw >= 1) {
        window.scrollTo({ top: 0 });
        setTimeout(() => {
          el.style.transform = "";
          el.style.filter = "";
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          el.dataset.driving = "";
          driveStartRef.current = 0;
        }, 50);
        return;
      }
      driveRafRef.current = requestAnimationFrame(animate);
    };

    driveStartRef.current = 0;
    driveRafRef.current = requestAnimationFrame(animate);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isReducedMotion]);

  useEffect(() => {
    return () => cancelAnimationFrame(driveRafRef.current);
  }, []);

  const baseImageClasses =
    "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

  return (
    <button
      ref={containerRef}
      type="button"
      aria-label="Back to top"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-16 h-10 sm:w-20 sm:h-12 md:w-24 md:h-14 cursor-pointer bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#E5231B] focus-visible:ring-offset-2 rounded-sm"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      <img
        src="/onscroll hover/car-off.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={baseImageClasses}
      />
      <img
        src="/onscroll hover/car-on.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={baseImageClasses}
        style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.3s ease-out" }}
      />
    </button>
  );
}
