"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onDrag" | "onDragStart" | "onDragEnd"
>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] text-white transition-all duration-200 placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:border-white/30",
          className
        )}
        ref={ref}
        whileFocus={{
          scale: 1.01,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.input>)}
      />
    );
  }
);
Input.displayName = "Input";







