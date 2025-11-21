"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white transition placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          className
        )}
        ref={ref}
        whileFocus={{
          scale: 1.01,
          borderColor: "rgba(255, 255, 255, 0.3)",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";







