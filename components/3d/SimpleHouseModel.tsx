"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getHouse3DConfig } from "./config";

/**
 * Version simplifiée du HouseModel qui utilise une forme de base
 * au lieu d'un modèle GLB - SANS GSAP ScrollTrigger pour éviter les erreurs
 */
export function SimpleHouseModel() {
  const config = getHouse3DConfig();
  const groupRef = useRef<THREE.Group>(null);

  // Rotation simple avec useFrame (pas de GSAP)
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1; // Rotation douce
    }
  });

  return (
    <group
      ref={groupRef}
      scale={config.model.scale}
      position={[
        config.model.initialPosition.x,
        config.model.initialPosition.y,
        config.model.initialPosition.z,
      ]}
    >
      {/* Toit (pyramide) */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[1.5, 1, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Corps de la maison (cube) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#F4C430" />
      </mesh>

      {/* Porte */}
      <mesh position={[0, -0.4, 1.01]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* Fenêtre gauche */}
      <mesh position={[-0.6, 0.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Fenêtre droite */}
      <mesh position={[0.6, 0.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
    </group>
  );
}
