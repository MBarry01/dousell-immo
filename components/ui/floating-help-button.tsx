"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface FloatingHelpButtonProps {
  onClick: () => void;
}

export function FloatingHelpButton({ onClick }: FloatingHelpButtonProps) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Attendre que le splash screen soit complètement retiré
    const checkSplash = setInterval(() => {
      if (document.getElementById("splash-blocker") === null) {
        setMounted(true);
        clearInterval(checkSplash);
      }
    }, 200);

    return () => clearInterval(checkSplash);
  }, []);

  const button = (
    <button
      onClick={onClick}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-4 right-4 z-[9999] p-2.5 rounded-full transition-all duration-200 shadow-lg ${isDark
        ? "bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
        : "bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
        }`}
      title="Relancer le tutoriel"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    </button>
  );

  if (!mounted) return null;

  return createPortal(button, document.body);
}
