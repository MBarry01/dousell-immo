"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-transparent",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black hover:bg-neutral-200 focus-visible:ring-white/80",
        secondary:
          "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/40",
        outline:
          "border border-white/30 text-white hover:bg-white/10 focus-visible:ring-white/30",
        ghost:
          "text-white/80 hover:text-white focus-visible:ring-white/40 hover:bg-white/10",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button;

    // Si asChild, on utilise Slot (pas d'animation)
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        />
      );
    }

    // Sinon, on utilise motion.button avec animations
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled}
        whileTap={disabled ? {} : { scale: 0.96 }}
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
Button.displayName = "Button";







