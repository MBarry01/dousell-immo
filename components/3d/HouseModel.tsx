"use client";

import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getHouse3DConfig } from "./config";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HouseModel() {
  const config = getHouse3DConfig();
  const { scene } = useGLTF(config.model.path);
  const houseRef = useRef<THREE.Group>(null);

  useGSAP(() => {
    if (!houseRef.current || typeof window === "undefined") return;

    // SCÈNE 1 : Vitrine (Rotation douce au début)
    if (config.rotation.enabled) {
      gsap.to(houseRef.current.rotation, {
        y: Math.PI * 2, // Tourne sur elle-même
        duration: config.rotation.duration,
        repeat: -1,
        ease: config.rotation.ease,
      });
    }

    // SCÈNE 2 : Transition vers SaaS (Au scroll)
    if (config.scrollTransition.enabled) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: config.scrollTransition.triggerSelector,
          start: config.scrollTransition.start,
          end: config.scrollTransition.end,
          scrub: config.scrollTransition.scrub,
        },
      });

      tl.to(houseRef.current.position, {
        x: config.scrollTransition.finalPosition.x,
        z: config.scrollTransition.finalPosition.z,
      });

      tl.to(houseRef.current.rotation, {
        y: config.scrollTransition.finalRotation.y,
      }, "<"); // En même temps
    }

  }, { scope: houseRef });

  return (
    <primitive
      object={scene}
      ref={houseRef}
      scale={config.model.scale}
      position={[
        config.model.initialPosition.x,
        config.model.initialPosition.y,
        config.model.initialPosition.z,
      ]}
    />
  );
}

// Préchargement du modèle
const config = getHouse3DConfig();
useGLTF.preload(config.model.path);
