"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

type GlobeMeshProps = {
  pointer: React.RefObject<{ x: number; y: number }>;
  scrollProgress?: React.RefObject<number>;
};

const BASE_SCALE = 0.85;
const BASE_X = 2.1;
const BASE_Y = -0.2;

export default function GlobeMesh({ pointer, scrollProgress }: GlobeMeshProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.5, 0.005, 8, 96), []);
  const ring2Geo = useMemo(() => new THREE.TorusGeometry(1.68, 0.003, 8, 96), []);

  useFrame((state, delta) => {
    const progress = scrollProgress?.current ?? 0;
    const speedBoost = 1 + progress * 2.2;

    if (core.current) {
      core.current.rotation.y += delta * 0.18 * speedBoost;
      core.current.rotation.x += delta * 0.03 * speedBoost;
    }
    if (ring.current) ring.current.rotation.z += delta * 0.12 * speedBoost;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.08 * speedBoost;

    if (group.current) {
      const targetY = (pointer.current?.x ?? 0) * 0.35;
      const targetX = (pointer.current?.y ?? 0) * -0.2;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04;

      const targetScale = BASE_SCALE + progress * 2.6;
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.08)
      );

      const targetPosX = THREE.MathUtils.lerp(BASE_X, 0, progress);
      const targetPosZ = THREE.MathUtils.lerp(0, 3.2, progress);
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x,
        targetPosX,
        0.08
      );
      group.current.position.z = THREE.MathUtils.lerp(
        group.current.position.z,
        targetPosZ,
        0.08
      );
    }
  });

  return (
    <group ref={group} position={[BASE_X, BASE_Y, 0]} scale={BASE_SCALE}>
      <Icosahedron ref={core} args={[1.1, 20]}>
        <MeshDistortMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.4}
          roughness={0.15}
          metalness={0.6}
          distort={0.3}
          speed={1.1}
          wireframe
        />
      </Icosahedron>

      <Icosahedron args={[1.08, 14]} scale={0.98}>
        <meshBasicMaterial color="#0a0e17" transparent opacity={0.85} />
      </Icosahedron>

      <mesh ref={ring} geometry={ringGeo} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring2} geometry={ring2Geo} rotation={[Math.PI / 1.7, 0.3, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
