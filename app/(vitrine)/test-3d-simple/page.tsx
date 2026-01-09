"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function SimpleBox() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#F4C430" />
    </mesh>
  );
}

export default function Test3DSimple() {
  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Test Canvas 3D Simple */}
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <Suspense fallback={null}>
            <SimpleBox />
          </Suspense>
        </Canvas>
      </div>

      {/* Contenu HTML */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white p-6">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-amber-500 to-yellow-600">
          Test 3D Simple
        </h1>

        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 max-w-2xl">
          <p className="text-xl mb-4">
            ✅ Si vous voyez un cube doré qui tourne, React Three Fiber fonctionne !
          </p>

          <div className="space-y-2 text-left">
            <p className="text-sm text-slate-400">Diagnostic :</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Canvas 3D : Initialisé</li>
              <li>Lumières : Actives</li>
              <li>Forme de base : Cube doré</li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-amber-500 font-semibold mb-2">
              Prochaines étapes :
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
              <li>Si le cube s'affiche → Le problème vient du modèle GLB</li>
              <li>Si rien ne s'affiche → Problème avec React Three Fiber</li>
              <li>Ouvrez la console (F12) pour voir les erreurs</li>
            </ol>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/landing-3d"
            className="px-6 py-3 bg-amber-500 text-black rounded-full font-semibold hover:bg-amber-600 transition-colors"
          >
            Retour à la Landing 3D
          </a>
        </div>
      </div>
    </div>
  );
}
