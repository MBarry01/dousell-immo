"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";

const ToggleGroup = ToggleGroupPrimitive.Root;

const ToggleGroupItem = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      "inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition data-[state=on]:border-white data-[state=on]:bg-white/10 data-[state=on]:text-white",
      className
    )}
    {...props}
  />
);

export { ToggleGroup, ToggleGroupItem };







