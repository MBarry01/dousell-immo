"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 ease-out focus-visible:ring-primary",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 ease-out focus-visible:ring-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] transition-all duration-200 ease-out",
        outline:
          "border border-input bg-background text-foreground hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-out",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] transition-all duration-200 ease-out",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd"
> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, ...props }, ref) => {
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
      <motion.button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        suppressHydrationWarning
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      />
    );
  }
);
Button.displayName = "Button";

