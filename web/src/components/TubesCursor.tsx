// components/TubesCursor.tsx
"use client";

import { useEffect, useRef } from "react";

// Module-level, not inline default-parameter literals: an array literal
// written directly in a default parameter is a *new* object on every call,
// so a parent that re-renders often (e.g. Hero during its scroll-jack
// animation) would make the effect below see "changed" deps every time and
// tear down + recreate the whole WebGL context in a runaway loop.
const DEFAULT_TUBE_COLORS = ["#3b82f6", "#60a5fa", "#1d4ed8"];
const DEFAULT_LIGHT_COLORS = ["#3b82f6", "#60a5fa", "#1d4ed8", "#93c5fd"];

type TubesCursorProps = {
  title?: string;
  subtitle?: string;
  caption?: string;
  initialColors?: string[];   // tubes base colors
  lightColors?: string[];     // lights colors
  lightIntensity?: number;    // lights intensity
  titleSize?: string;         // Tailwind text size classes
  subtitleSize?: string;
  captionSize?: string;
  enableRandomizeOnClick?: boolean;
  className?: string;         // extra classes for wrapper
  /** Show the title/subtitle/caption overlay. Off when used as a background
   * layer inside another section that already has its own copy. */
  showText?: boolean;
  /** Override the wrapper's own classes entirely (default assumes a
   * standalone full-viewport page). Needed when embedding this as a layer
   * inside an existing section instead of using it as a whole page. */
  wrapperClassName?: string;
  /** Override the canvas's own classes entirely. The default `fixed inset-0`
   * anchors to the viewport regardless of ancestors, which is wrong once
   * this is nested inside a section rather than used as a full page. */
  canvasClassName?: string;
};

const TubesCursor = ({
  title = "Tubes",
  subtitle = "Cursor",
  caption = "WebGPU / WebGL",
  initialColors = DEFAULT_TUBE_COLORS,
  lightColors = DEFAULT_LIGHT_COLORS,
  lightIntensity = 200,
  titleSize = "text-[80px]",
  subtitleSize = "text-[60px]",
  captionSize = "text-base",
  enableRandomizeOnClick = true,
  className = "",
  showText = true,
  wrapperClassName,
  canvasClassName,
}: TubesCursorProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let removeClick: (() => void) | null = null;
    let destroyed = false;

    (async () => {
      const mod = await import(
        /* webpackIgnore: true */
        // @ts-expect-error -- runtime URL import; no local module/types exist for this CDN-hosted script
        "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
      );
      const TubesCursorCtor = (mod as any).default ?? mod;

      if (!canvasRef.current || destroyed) return;

      const app = TubesCursorCtor(canvasRef.current, {
        tubes: {
          colors: initialColors,
          lights: {
            intensity: lightIntensity,
            colors: lightColors,
          },
        },
      });

      appRef.current = app;

      if (enableRandomizeOnClick) {
        const handler = () => {
          const colors = randomColors(initialColors.length);
          const lights = randomColors(lightColors.length);
          app.tubes.setColors(colors);
          app.tubes.setLightsColors(lights);
        };
        document.body.addEventListener("click", handler);
        removeClick = () =>
          document.body.removeEventListener("click", handler);
      }
    })();

    return () => {
      destroyed = true;
      if (removeClick) removeClick();
      try {
        appRef.current?.dispose?.();
        appRef.current = null;
      } catch {
        // ignore
      }
    };
  }, [initialColors, lightColors, lightIntensity, enableRandomizeOnClick]);

  return (
    <div className={wrapperClassName ?? `relative h-screen w-screen overflow-hidden ${className}`}>
      {/* Background canvas */}
      <canvas ref={canvasRef} className={canvasClassName ?? "fixed inset-0 block h-full w-full"} />

      {showText && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 select-none">
          <h1
            className={`m-0 p-0 text-white font-bold uppercase leading-none drop-shadow-[0_0_20px_rgba(0,0,0,1)] ${titleSize}`}
          >
            {title}
          </h1>
          <h2
            className={`m-0 p-0 text-white font-medium uppercase leading-none drop-shadow-[0_0_20px_rgba(0,0,0,1)] ${subtitleSize}`}
          >
            {subtitle}
          </h2>
          <p
            className={`m-0 p-0 text-white leading-none drop-shadow-[0_0_20px_rgba(0,0,0,1)] ${captionSize}`}
          >
            {caption}
          </p>
        </div>
      )}
    </div>
  );
};

function randomColors(count: number) {
  return new Array(count).fill(0).map(
    () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
  );
}

export { TubesCursor };
