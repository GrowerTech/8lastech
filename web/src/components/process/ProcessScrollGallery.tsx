"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Step = {
  icon: ReactNode;
  title: string;
  description: string;
};

type ProcessScrollGalleryProps = {
  steps: Step[];
};

export default function ProcessScrollGallery({ steps }: ProcessScrollGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [frameWidth, setFrameWidth] = useState(1000);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionListener);
    return () => motionQuery.removeEventListener("change", motionListener);
  }, []);

  // Track the sticky frame's own width so the math below stays exact on
  // every screen size, no separate mobile/desktop breakpoints needed.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setFrameWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Card fills the left ~58% of the frame, leaving the rest as visible
  // empty space where the connector arrow travels before the next card
  // arrives. itemWidth + gap === frameWidth, so each step's slide moves
  // the row by exactly one frame — the next card lands precisely where
  // the previous one started.
  const itemWidth = Math.round(frameWidth * 0.58);
  const gap = frameWidth - itemWidth;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const segments = Math.max(steps.length - 1, 1);
  // Each segment is split in two: first half holds the row still while the
  // connector grows, second half slides the row so the next card arrives
  // at the frame's left edge — arrow connects first, then the card follows.
  const xInput = [0];
  const xOutput = [0];
  for (let i = 0; i < segments; i++) {
    const segStart = i / segments;
    const holdEnd = segStart + 0.5 / segments;
    const segEnd = (i + 1) / segments;
    xInput.push(holdEnd, segEnd);
    xOutput.push(-i * frameWidth, -(i + 1) * frameWidth);
  }
  const x = useTransform(scrollYProgress, xInput, xOutput);

  // Each connector finishes growing at the segment's halfway point (the
  // "hold" phase), then stays fully connected while the row slides. Once a
  // connector is fully grown, the card it leads into glows — the glow hands
  // off to the next card as soon as that card's own outgoing connector
  // starts growing, so only the just-arrived card is ever lit up. Card 0 has
  // no incoming connector, so it's treated as "arrived" from the very start
  // (glowing immediately, then fading via the same outgoing hand-off).
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const stepProgress = latest * segments;
    const connectorLocals: number[] = [];
    connectorRefs.current.forEach((el, i) => {
      const local = Math.min(Math.max((stepProgress - i) * 2, 0), 1);
      connectorLocals[i] = local;
      if (el) el.style.setProperty("--progress", String(local));
    });
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const incoming = i > 0 ? connectorLocals[i - 1] : 1;
      const outgoing = i < connectorLocals.length ? connectorLocals[i] : 0;
      const glow = Math.min(Math.max(incoming - outgoing, 0), 1);
      el.style.setProperty("--glow", String(glow));
    });
  });

  if (reducedMotion) {
    return (
      <div className="mt-16 -mx-6 flex items-center gap-6 overflow-x-auto px-6 pb-4 sm:-mx-10 sm:px-10">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-shrink-0 items-center gap-6">
            <StepCard step={step} index={i} width={280} />
            {i < steps.length - 1 && (
              <ArrowRight size={22} weight="fill" className="text-accent-2 shrink-0" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mt-16" style={{ height: "400vh" }}>
      <div
        ref={wrapperRef}
        className="sticky top-20 flex h-[75vh] items-center overflow-visible"
      >
        <motion.div className="flex items-center" style={{ x }}>
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-shrink-0 items-center">
              <StepCard
                step={step}
                index={i}
                width={itemWidth}
                cardRef={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
              {i < steps.length - 1 && (
                <div
                  ref={(el) => {
                    connectorRefs.current[i] = el;
                  }}
                  className="connector-glow flex flex-shrink-0 items-center"
                  style={{ width: gap, ["--progress" as string]: 0 }}
                >
                  <div className="relative h-[3px] flex-1 rounded-full bg-border">
                    <div className="connector-bar absolute inset-y-0 left-0 rounded-full bg-accent-2" />
                  </div>
                  <ArrowRight
                    size={28}
                    weight="fill"
                    className="connector-arrow -ml-1.5 shrink-0 text-accent-2"
                  />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  width,
  cardRef,
}: {
  step: Step;
  index: number;
  width: number;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const { icon, title, description } = step;
  return (
    <div
      ref={cardRef}
      className="card-glow flex h-[480px] flex-shrink-0 flex-col items-start rounded-2xl border border-border bg-card p-10 sm:p-12"
      style={{ width, ["--glow" as string]: index === 0 ? 1 : 0 }}
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-background text-accent-2">
        {icon}
      </div>
      <span className="mt-8 text-sm font-medium text-muted-2 tracking-widest">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-2 font-heading text-4xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-md text-lg text-muted leading-relaxed">{description}</p>
    </div>
  );
}
