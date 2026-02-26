"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
}

interface ShootingStarsProps {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  className?: string;
}

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * window.innerWidth;

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 };
    case 1:
      return { x: window.innerWidth, y: offset, angle: 135 };
    case 2:
      return { x: offset, y: window.innerHeight, angle: 225 };
    case 3:
      return { x: 0, y: offset, angle: 315 };
    default:
      return { x: 0, y: 0, angle: 45 };
  }
};

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#9E00FF",
  trailColor = "#2EB9DF",
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const [star, setStar] = useState<ShootingStar | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Simplified non-CPU intensive star creation (no state loops)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      const newStar: ShootingStar = {
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: maxSpeed, // Fixed speed for simplicity
        distance: 0,
      };
      setStar(newStar);

      // Remove star after animation completes (approx 2s)
      setTimeout(() => setStar(null), 2000);

      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutId = setTimeout(triggerStar, randomDelay);
    };

    timeoutId = setTimeout(triggerStar, minDelay);

    return () => clearTimeout(timeoutId);
  }, [minDelay, maxDelay, maxSpeed]);

  return (
    <svg
      ref={svgRef}
      className={cn("w-full h-full absolute inset-0 pointer-events-none overflow-hidden", className)}
    >
      {star && (
        <rect
          key={star.id}
          x={star.x}
          y={star.y}
          width={starWidth * 15} // Made it longer to act like a real shooting star using CSS
          height={starHeight}
          fill="url(#gradient)"
          className="animate-shooting-star"
          transform={`rotate(${star.angle}, ${star.x}, ${star.y})`}
          style={{
            transformOrigin: `${star.x}px ${star.y}px`,
            animation: `shoot 2s linear forwards`
          }}
        />
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shoot {
          0% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          100% { transform: translateX(100vw) translateY(100vh) scale(1.5); opacity: 0; }
        }
      `}} />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop
            offset="100%"
            style={{ stopColor: starColor, stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};
