"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Initialiser les refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus sur le premier champ au montage
  useEffect(() => {
    // Toujours focus sur le premier champ au montage
    if (inputRefs.current[0]) {
      // Utiliser un petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, []);

  // Refocus sur le premier champ quand la valeur est réinitialisée
  useEffect(() => {
    if (value === "" && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [value]);

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Accepter uniquement les chiffres
    const sanitized = newValue.replace(/\D/g, "");
    if (!sanitized) return;

    // Prendre uniquement le dernier chiffre saisi
    const digit = sanitized.slice(-1);

    // Construire la nouvelle valeur
    const newOtp = value.split("");
    newOtp[index] = digit;
    const updatedValue = newOtp.join("");

    onChange(updatedValue);

    // Passer au champ suivant
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Déclencher onComplete si tous les champs sont remplis
    if (updatedValue.length === length && onComplete) {
      onComplete(updatedValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Backspace : effacer et revenir au champ précédent
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = value.split("");

      if (newOtp[index]) {
        // Effacer le champ actuel
        newOtp[index] = "";
        onChange(newOtp.join(""));
      } else if (index > 0) {
        // Si le champ actuel est vide, revenir au précédent et l'effacer
        newOtp[index - 1] = "";
        onChange(newOtp.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Flèche gauche : champ précédent
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    // Flèche droite : champ suivant
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text/plain");
    const sanitized = pastedData.replace(/\D/g, "").slice(0, length);

    if (sanitized) {
      onChange(sanitized);
      // Focus sur le dernier champ rempli
      const lastIndex = Math.min(sanitized.length - 1, length - 1);
      inputRefs.current[lastIndex]?.focus();

      // Déclencher onComplete si tous les champs sont remplis
      if (sanitized.length === length && onComplete) {
        onComplete(sanitized);
      }
    }
  };

  const values = value.split("");

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={cn(
            "h-12 w-12 text-center text-xl font-semibold rounded-xl",
            "border-2 transition-all duration-200",
            "bg-white/5 text-white",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
              : focusedIndex === index
                ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500/50"
                : values[index]
                  ? "border-amber-500/50"
                  : "border-white/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={`Code digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
