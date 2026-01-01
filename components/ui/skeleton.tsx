import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const skeletonVariants = cva(
  "rounded-md overflow-hidden",
  {
    variants: {
      variant: {
        default: "animate-pulse bg-muted",
        luxury: [
          "relative isolate",
          "bg-gradient-to-r from-muted via-muted to-muted",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r",
          "before:from-transparent before:via-primary/10 before:to-transparent",
          "before:animate-[shimmer-luxury_2s_ease-in-out_infinite]",
          "before:bg-[length:200%_100%]",
          "after:absolute after:inset-0",
          "after:bg-gradient-to-r after:from-transparent after:via-primary/5 after:to-transparent",
          "after:blur-xl",
        ],
        card: [
          "relative isolate h-full",
          "bg-gradient-to-br from-muted/80 via-muted to-muted/80",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r",
          "before:from-transparent before:via-primary/8 before:to-transparent",
          "before:animate-[shimmer-luxury_2.5s_ease-in-out_infinite]",
          "before:bg-[length:200%_100%]",
        ],
        text: "animate-pulse bg-muted/60 h-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
