import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Trading specific variants
        bullish:
          "border-transparent bg-bullish text-primary-foreground hover:bg-bullish/80",
        bearish:
          "border-transparent bg-bearish text-primary-foreground hover:bg-bearish/80",
        neutral:
          "border-transparent bg-neutral text-primary-foreground hover:bg-neutral/80",
        "high-oi":
          "border-transparent bg-high-oi text-primary-foreground hover:bg-high-oi/80",
        "high-volume":
          "border-transparent bg-high-volume text-primary-foreground hover:bg-high-volume/80",
        atm:
          "border-transparent bg-atm text-primary-foreground hover:bg-atm/80",
        itm:
          "border-transparent bg-itm text-primary-foreground hover:bg-itm/80",
        otm:
          "border-transparent bg-otm text-primary-foreground hover:bg-otm/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "bullish" | "bearish" | "neutral" | "high-oi" | "high-volume" | "atm" | "itm" | "otm";
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
