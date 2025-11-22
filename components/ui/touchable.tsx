"use client";

import { motion } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

type TouchableProps = {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  scale?: number;
};

/**
 * Composant wrapper pour éléments cliquables avec feedback tactile natif
 * Imite le comportement iOS/Android avec haptic feedback
 */
export function Touchable({
  children,
  className,
  onClick,
  disabled = false,
  scale = 0.96,
}: TouchableProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    // Haptic Feedback pour Android/iOS
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore si la vibration n'est pas supportée
      }
    }

    onClick?.(e);
  };

  return (
    <motion.div
      whileTap={disabled ? {} : { scale }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={className}
      onClick={handleClick}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </motion.div>
  );
}


