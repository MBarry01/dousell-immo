"use client";

import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { HouseModel } from "./HouseModel";
import { Suspense } from "react";
import { getHouse3DConfig } from "./config";
import { Loader3D } from "./Loader";

export default function Scene() {
  const config = getHouse3DConfig();

  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
      <Canvas camera={{ position: config.camera.position, fov: config.camera.fov }}>
        {/* Lumières */}
        <ambientLight intensity={config.lights.ambient.intensity} />
        <directionalLight
          position={config.lights.directional.position}
          intensity={config.lights.directional.intensity}
        />
        <directionalLight
          position={config.lights.directional2.position}
          intensity={config.lights.directional2.intensity}
        />

        {/* Environnement pour de jolis reflets sur les vitres */}
        {/* Désactivé car nécessite des fichiers HDR qui ne sont pas inclus par défaut */}
        {/* <Environment preset={config.environment.preset} /> */}

        <Suspense fallback={<Loader3D />}>
          {config.float.enabled ? (
            <Float
              speed={config.float.speed}
              rotationIntensity={config.float.rotationIntensity}
              floatIntensity={config.float.floatIntensity}
            >
              <HouseModel />
            </Float>
          ) : (
            <HouseModel />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
