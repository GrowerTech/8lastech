"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });
const TubesCursor = dynamic(
  () => import("../TubesCursor").then((m) => m.TubesCursor),
  { ssr: false }
);

const HEADLINE_WORDS = [
  { text: "We build,", gradient: false },
  { text: "innovate,", gradient: false },
  { text: "and elevate", gradient: true },
  { text: "your digital future.", gradient: false },
];

/** Wheel/touch delta (px) needed to fully complete the zoom-through. */
const ZOOM_DISTANCE = 900;
/** Portion of progress (0-1) after which the globe dissolves into About. */
const DISSOLVE_START = 0.85;
/** Minimum time (ms) About stays fully visible and undismissable once the
 * globe finishes dissolving, before real page scroll is handed back. A
 * *distance*-based buffer doesn't work here: a real trackpad fling can
 * deliver deltaY values of several hundred px per event, so any fixed pixel
 * budget gets consumed in one or two events — i.e. effectively zero visible
 * time. Gating on elapsed time instead guarantees About is actually seen,
 * no matter how hard the next scroll tick pushes. */
const ABOUT_HOLD_MS = 500;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export default function Hero() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef(0);
  const rafPending = useRef(false);
  // performance.now() timestamp of when the About hold-timer expires; 0 while
  // the globe hasn't finished dissolving yet (no timer armed).
  const holdUntilRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);

    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => {
      mq.removeEventListener("change", listener);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Locked while the globe hasn't finished dissolving, or while About's hold
  // timer hasn't expired yet. documentElement is the actual scrollingElement
  // here (body's overflow-x-only rule doesn't propagate to it) — locking
  // body alone left <html> freely scrollable, so the page could scroll out
  // from under a Hero that was still fixed/opaque on top, looking completely
  // stuck.
  const updateScrollLock = useCallback(() => {
    const locked = progressRef.current < 1 || performance.now() < holdUntilRef.current;
    const overflow = locked ? "hidden" : "";
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = overflow;
  }, []);

  const applyProgress = useCallback(
    (next: number) => {
      progressRef.current = next;
      document.documentElement.style.setProperty(
        "--about-reveal",
        String(clamp01((next - DISSOLVE_START) / (1 - DISSOLVE_START)))
      );
      updateScrollLock();
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(() => {
          setProgress(progressRef.current);
          rafPending.current = false;
        });
      }
    },
    [updateScrollLock]
  );

  const zoomBy = useCallback(
    (deltaY: number, distance: number) => {
      const p = progressRef.current;
      const atTop = window.scrollY <= 0;

      if (deltaY > 0) {
        if (p < 1) {
          const next = clamp01(p + deltaY / distance);
          applyProgress(next);
          if (next >= 1) holdUntilRef.current = performance.now() + ABOUT_HOLD_MS;
          return true;
        }
        // Globe fully dissolved, About on screen — swallow forward scroll
        // until the hold timer expires, no matter how large deltaY is.
        if (performance.now() < holdUntilRef.current) return true;
        updateScrollLock();
        return false;
      }

      if (deltaY < 0 && atTop) {
        // Reversing while About is held cancels the hold and starts zooming
        // the globe back in, so scrolling up always leads back home — this
        // is the only path back to Hero besides the hash-based Home link.
        if (p >= 1) holdUntilRef.current = 0;
        if (p > 0) {
          applyProgress(clamp01(p + deltaY / distance));
          return true;
        }
      }

      return false;
    },
    [applyProgress, updateScrollLock]
  );

  // Intercepts scroll input to drive the zoom instead of moving the page,
  // so the globe fills the screen before About is allowed to scroll into view.
  useEffect(() => {
    if (!mounted || reducedMotion) return;

    holdUntilRef.current = 0;
    applyProgress(0);

    // A URL that already carries a #section hash (a stale address bar, a
    // link shared with a fragment) makes the browser jump straight there
    // during initial load/paint — before this effect ever runs. That leaves
    // the document scrolled deep into the page while Hero still renders its
    // fixed full-viewport intro on top, so finishing the intro "reveals"
    // wherever the hash pointed instead of About. Force back to the top so
    // the intro always starts from a clean state.
    if (window.scrollY !== 0 || window.location.hash) {
      window.scrollTo(0, 0);
    }

    const handleWheel = (e: WheelEvent) => {
      if (zoomBy(e.deltaY, ZOOM_DISTANCE)) e.preventDefault();
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - currentY;
      if (zoomBy(deltaY, ZOOM_DISTANCE * 0.6)) {
        e.preventDefault();
        touchStartY = currentY;
      }
    };

    const KEY_DELTA: Record<string, number> = {
      ArrowDown: 120,
      PageDown: 600,
      " ": 600,
      End: 5000,
      ArrowUp: -120,
      PageUp: -600,
      Home: -5000,
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const delta = KEY_DELTA[e.key];
      if (delta === undefined) return;
      if (zoomBy(delta, ZOOM_DISTANCE)) e.preventDefault();
    };

    // Nav links (Navbar's <a href="#services">, etc.) jump via native
    // fragment navigation, which never goes through wheel/touch/keydown at
    // all — so it skips the lock entirely and can land the page anywhere
    // while Hero is still mid-intro. Treat an explicit nav click as the
    // user opting out of the intro rather than let it silently break the
    // lock: finish the intro immediately so it hands off cleanly.
    const handleClickCapture = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a[href^='#']");
      if (!link) return;

      if (link.getAttribute("href") === "#home") {
        // Hero is a fixed overlay rather than a normal in-flow section, so
        // the browser's native anchor-scroll can't reliably bring it back
        // (a fixed element is already "in view" from its perspective) —
        // drive it back to Hero directly instead.
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        holdUntilRef.current = 0;
        applyProgress(0);
        return;
      }

      const locked = progressRef.current < 1 || performance.now() < holdUntilRef.current;
      if (!locked) return;
      holdUntilRef.current = 0;
      applyProgress(1);
      updateScrollLock();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickCapture, true);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickCapture, true);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.style.setProperty("--about-reveal", "1");
      holdUntilRef.current = 0;
    };
  }, [mounted, reducedMotion, applyProgress, updateScrollLock, zoomBy]);

  const fadeClass = () =>
    `transition-all duration-700 ease-out ${
      revealed || reducedMotion
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-4"
    }`;
  const fadeStyle = (delayMs: number) =>
    reducedMotion ? undefined : { transitionDelay: `${delayMs}ms` };

  const jacking = mounted && !reducedMotion;
  const textOpacity = 1 - clamp01(progress / 0.55);
  const containerOpacity = 1 - clamp01((progress - DISSOLVE_START) / (1 - DISSOLVE_START));

  return (
    <section
      id="home"
      className={
        jacking
          ? "fixed inset-0 z-40 flex items-center overflow-hidden bg-background"
          : "relative min-h-dvh flex items-center overflow-hidden bg-background"
      }
      style={
        jacking
          ? {
              opacity: containerOpacity,
              pointerEvents: progress >= 1 ? "none" : "auto",
            }
          : undefined
      }
    >
      <div className="absolute inset-0 glow-accent" />
      <div className="absolute inset-0 grain-overlay" />

      {mounted && !reducedMotion && <HeroCanvas scrollProgress={progressRef} />}

      {/* Tubes cursor trail layered over the globe. mix-blend-screen drops
       * its opaque black background out (screen-blending with black is a
       * no-op) so only the glowing trail itself shows through, on top of
       * the globe rather than covering it. */}
      {mounted && !reducedMotion && (
        <TubesCursor
          showText={false}
          enableRandomizeOnClick={false}
          wrapperClassName="absolute inset-0 pointer-events-none"
          canvasClassName="absolute inset-0 block h-full w-full mix-blend-screen opacity-80"
        />
      )}

      {/* Contrast scrim: guarantees headline/CTA legibility regardless of 3D scene state */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20 sm:to-background/10"
        aria-hidden="true"
      />

      {(!mounted || reducedMotion) && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-20"
          aria-hidden="true"
        >
          <div className="w-[420px] h-[420px] rounded-full border border-accent/40" />
        </div>
      )}

      <div
        className="relative z-10 mx-auto max-w-7xl w-full px-6 sm:px-10 pt-28 pb-20"
        style={
          jacking
            ? {
                opacity: textOpacity,
                transform: `translateY(${-progress * 60}px) scale(${1 - progress * 0.06})`,
                pointerEvents: progress > 0.55 ? "none" : "auto",
              }
            : undefined
        }
      >
        <div className="max-w-3xl">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted backdrop-blur mb-8 ${fadeClass()}`}
            style={fadeStyle(0)}
          >
            <Sparkle size={16} weight="fill" className="text-accent-2" />
            Your long-term technology partner
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tight text-balance">
            {HEADLINE_WORDS.map((word, i) => (
              <span
                key={word.text}
                className={`inline-block mr-3 ${word.gradient ? "text-gradient" : ""} ${fadeClass()}`}
                style={fadeStyle(80 * i + 80)}
              >
                {word.text}
              </span>
            ))}
          </h1>

          <p
            className={`mt-6 text-lg sm:text-xl text-muted max-w-xl leading-relaxed text-pretty ${fadeClass()}`}
            style={fadeStyle(500)}
          >
            8LasTech turns ideas and business challenges into modern, scalable
            digital products — web applications, custom software, UI/UX
            design, and automation, built by a team that partners with you
            for the long run.
          </p>

          <div
            className={`mt-10 flex flex-wrap items-center gap-4 ${fadeClass()}`}
            style={fadeStyle(600)}
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-on-accent font-medium transition-all duration-200 hover:bg-accent-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95"
            >
              Start a Project
              <ArrowRight
                size={18}
                weight="bold"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 font-medium text-foreground transition-all duration-200 hover:border-accent-2 hover:text-accent-2 active:scale-95"
            >
              See Our Work
            </a>
          </div>

          <div
            className={`mt-16 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-muted-2 ${fadeClass()}`}
            style={fadeStyle(700)}
          >
            <span>Web Applications</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span>Custom Software</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span>UI/UX Design</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span>Automation</span>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-2 text-xs tracking-widest uppercase transition-opacity duration-300"
        style={jacking ? { opacity: 1 - Math.min(progress * 3, 1) } : undefined}
        aria-hidden="true"
      >
        <span>Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-muted-2 to-transparent" />
      </div>
    </section>
  );
}
