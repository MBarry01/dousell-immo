"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onDrag" | "onDragStart" | "onDragEnd"
> & { whileFocus?: any };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-input bg-background px-4 text-[16px] text-foreground transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-slate-400 dark:focus-visible:border-slate-500",
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







