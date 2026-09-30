"use client";

import { useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import GlobeMesh from "./GlobeMesh";
import ParticleField from "./ParticleField";

type HeroCanvasProps = {
  scrollProgress?: React.RefObject<number>;
};

export default function HeroCanvas({ scrollProgress }: HeroCanvasProps) {
  const pointer = useRef({ x: 0, y: 0 });

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = (clientY / window.innerHeight) * 2 - 1;
    pointer.current = { x, y };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => updatePointer(e.clientX, e.clientY),
    [updatePointer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    },
    [updatePointer]
  );

  return (
    <div
      className="absolute inset-0"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#3b82f6" />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="#60a5fa" />
        <GlobeMesh pointer={pointer} scrollProgress={scrollProgress} />
        <ParticleField pointer={pointer} count={900} />
      </Canvas>
    </div>
  );
}
