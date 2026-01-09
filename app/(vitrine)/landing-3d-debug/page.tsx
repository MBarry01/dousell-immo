"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function RotatingHouse() {
  const groupRef = useRef<THREE.Group>(null);

  // Rotation simple avec useFrame (pas de GSAP)
  // useFrame(() => {
  //   if (groupRef.current) {
  //     groupRef.current.rotation.y += 0.005;
  //   }
  // });

  return (
    <group ref={groupRef} scale={1.5}>
      {/* Toit */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[1.5, 1, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Corps */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#F4C430" />
      </mesh>

      {/* Porte */}
      <mesh position={[0, -0.4, 1.01]}>
        <boxGeometry args={[0.5, 0.8, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
}

export default function Landing3DDebug() {
  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Canvas 3D */}
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <Suspense fallback={null}>
            <RotatingHouse />
          </Suspense>
        </Canvas>
      </div>

      {/* Contenu HTML */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white p-6">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-8 max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-amber-500 to-yellow-600">
            Debug Landing 3D
          </h1>

          <div className="space-y-4 text-slate-300">
            <p className="text-lg">
              ✅ Cette version est ultra-simplifiée (pas de GSAP, pas de GLB).
            </p>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-amber-500 mb-2">Si vous voyez la maison :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>React Three Fiber fonctionne ✅</li>
                <li>Le Canvas s'affiche ✅</li>
                <li>Le problème vient de GSAP ou du GLB</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-red-500 mb-2">Si vous ne voyez rien :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ouvrez la console (F12)</li>
                <li>Copiez l'erreur en rouge</li>
                <li>Le problème est plus profond</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                <strong>Console :</strong> Appuyez sur F12 et regardez l'onglet "Console"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
