"use client";

import {
  useEffect,
  useRef,
  useState,
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  type CSSProperties,
  type ReactElement,
} from "react";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** Unused — kept for call-site compatibility; items are now the direct children. */
  itemSelector?: string;
  stagger?: number;
  y?: number;
  as?: "div" | "section";
};

export default function RevealOnScroll({
  children,
  className,
  stagger = 0.08,
  y = 24,
  as = "div",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = as;

  return (
    <Comp ref={ref as never} className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        const existingStyle = (child.props as { style?: CSSProperties }).style;
        const style: CSSProperties = {
          ...existingStyle,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : `translateY(${y}px)`,
          transition: reducedMotion
            ? "none"
            : `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${(i * stagger).toFixed(2)}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${(i * stagger).toFixed(2)}s`,
        };
        return cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
          style,
        });
      })}
    </Comp>
  );
}
