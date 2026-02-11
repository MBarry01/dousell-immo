"use client";

import { toast as sonnerToast } from "sonner";

export interface Toast {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  return {
    toast: (props: Toast) => {
      const { title, description, variant } = props;
      const message = description || title || "Notification";

      if (variant === "destructive") {
        sonnerToast.error(message);
      } else {
        sonnerToast.success(message);
      }
    }
  };
}
