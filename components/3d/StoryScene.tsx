"use client";

import React, { useLayoutEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Float, Environment } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

// --- Model Paths ---
const MODEL_PATHS = {
    house: "/3D/house.glb",
    phone: "/3D/phone.glb",
    papers: "/3D/papers.glb",
    toolbox: "/3D/toolbox.glb",
    drill: "/3D/drill.glb",
    tablet: "/3D/tablet.glb",
    lock: "/3D/lock.glb",
    coin: "/3D/coin.glb",
};

// --- Preload Models ---
Object.values(MODEL_PATHS).forEach((path) => useGLTF.preload(path));

const SceneContent = () => {
    const houseRef = useRef<THREE.Group>(null);
    const chaosRef = useRef<THREE.Group>(null);
    const solutionRef = useRef<THREE.Group>(null);

    // Load Models
    const { scene: houseScene } = useGLTF(MODEL_PATHS.house);
    const { scene: phoneScene } = useGLTF(MODEL_PATHS.phone);
    const { scene: papersScene } = useGLTF(MODEL_PATHS.papers);
    const { scene: toolboxScene } = useGLTF(MODEL_PATHS.toolbox);
    const { scene: drillScene } = useGLTF(MODEL_PATHS.drill);
    const { scene: tabletScene } = useGLTF(MODEL_PATHS.tablet);
    const { scene: lockScene } = useGLTF(MODEL_PATHS.lock);
    const { scene: coinScene } = useGLTF(MODEL_PATHS.coin);

    useGSAP(() => {
        // --- Initial States ---
        // House: Centered, lower
        gsap.set(houseRef.current!.position, { x: 0, y: -1, z: 0 });
        gsap.set(houseRef.current!.scale, { x: 1.2, y: 1.2, z: 1.2 });

        // Chaos: Invisible initially
        gsap.set(chaosRef.current!.scale, { x: 0, y: 0, z: 0 });
        gsap.set(chaosRef.current!.position, { x: 0, y: 0, z: 0 });

        // Solution: Invisible initially
        gsap.set(solutionRef.current!.scale, { x: 0, y: 0, z: 0 });
        gsap.set(solutionRef.current!.position, { x: 3, y: 0, z: 1 }); // Start at "Right" but hidden

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body", // Timeline synced to total page scroll
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            },
        });

        // --- STEP 1 -> 2: Vitrine to Problem (0% -> 30%) ---
        // User scrolls to "Problème" section
        tl.to(
            houseRef.current!.position,
            {
                z: -2, // Recule
                duration: 3,
                ease: "power1.inOut",
            },
            0
        );

        // House rotation simply continues or specific move? Prompt says: Rot: [0, t*speed, 0] in step 1, then [0, 0.5, 0] in step 2.
        // Let's animate rotation to a fixed point for step 2
        tl.to(houseRef.current!.rotation, { y: 0.5, duration: 3 }, 0);
        tl.to(houseRef.current!.scale, { x: 1, y: 1, z: 1, duration: 3 }, 0);

        // Chaos appears "Pop"
        tl.to(
            chaosRef.current!.scale,
            { x: 1, y: 1, z: 1, duration: 2, ease: "back.out(1.7)" },
            1 // Start a bit later
        );

        // --- STEP 2 -> 3: Pause then Transition to Solution (30% -> 50% -> 80%) ---
        // 30% to 50% is "Pause dramatique" - handled by spacing in timeline

        // From 50% (approx) to 80%: Transition to Solution
        const step3Start = 5; // Arbitrary time unit mapping, 0-3 was step 1. Let's say 3-5 is pause.

        // Chaos disappears
        tl.to(
            chaosRef.current!.scale,
            { x: 0, y: 0, z: 0, duration: 2 },
            step3Start
        );

        // House moves left
        tl.to(
            houseRef.current!.position,
            { x: -3, y: -1.5, z: 0, duration: 3 },
            step3Start
        );
        tl.to(houseRef.current!.rotation, { y: 0.8, duration: 3 }, step3Start); // Façade view

        // Solution appears
        tl.to(
            solutionRef.current!.scale,
            { x: 1, y: 1, z: 1, duration: 2, ease: "back.out(1.7)" },
            step3Start + 1
        );
        tl.to(
            solutionRef.current!.position,
            { x: 3, y: 0, z: 1, duration: 3 }, // Ensure it's at target
            step3Start
        );

        // Note regarding timeline mapping:
        // With scrub: 1 and trigger: body, the duration is relative to scroll distance.
        // The exact percentage mapping depends on standard GSAP timeline duration distribution.
        // To enforcing % triggers more strictly, we could use separate ScrollTriggers, 
        // but a single timeline is smoother. keeping it as one fluid timeline.

    }, { scope: undefined }); // Global scope for body trigger, or scoped if container provided

    return (
        <>
            {/* <Environment preset="city" /> */}

            {/* GROUPE A: HOUSE */}
            <group ref={houseRef}>
                <primitive object={houseScene} />
            </group>

            {/* GROUPE B: CHAOS */}
            <group ref={chaosRef}>
                {/* Phone: Haut Droite [1.5, 2, 1] */}
                <Float speed={5} rotationIntensity={1} floatIntensity={2}>
                    <primitive
                        object={phoneScene}
                        position={[1.5, 2, 1]}
                        scale={0.5}
                    />
                </Float>

                {/* Papers: Haut Gauche [-1.5, 1.5, 0.5] */}
                <Float speed={5} rotationIntensity={1.5} floatIntensity={2}>
                    <primitive
                        object={papersScene}
                        position={[-1.5, 1.5, 0.5]}
                        scale={0.5}
                    />
                </Float>

                {/* Toolbox: Bas Droite [1.2, -1, 1] */}
                <Float speed={4} rotationIntensity={1} floatIntensity={1}>
                    <primitive
                        object={toolboxScene}
                        position={[1.2, -1, 1]}
                        scale={0.5}
                    />
                </Float>

                {/* Drill: Bas Gauche [-1.2, -0.5, 1] */}
                <Float speed={6} rotationIntensity={2} floatIntensity={1.5}>
                    <primitive
                        object={drillScene}
                        position={[-1.2, -0.5, 1]}
                        scale={0.5}
                    />
                </Float>
            </group>

            {/* GROUPE C: SOLUTION */}
            <group ref={solutionRef}>
                {/* Tablet: Centre du groupe [0, 0, 0] */}
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <primitive
                        object={tabletScene}
                        position={[0, 0, 0]}
                    />
                </Float>

                {/* Lock: Gauche [-0.8, 0.5, 0.2] */}
                <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.5}>
                    <primitive
                        object={lockScene}
                        position={[-0.8, 0.5, 0.2]}
                        scale={0.3}
                    />
                </Float>

                {/* Coin: Droite [0.8, -0.5, 0.2] */}
                <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <primitive
                        object={coinScene}
                        position={[0.8, -0.5, 0.2]}
                        scale={0.3}
                    />
                </Float>
            </group>
        </>
    );
};

export default function StoryScene() {
    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <hemisphereLight intensity={0.5} groundColor="#f0f0f0" />
                <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
                <pointLight position={[-5, 5, 5]} intensity={1} />
                <SceneContent />
            </Canvas>
        </div>
    );
}
