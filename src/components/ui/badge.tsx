import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[4px] border border-iron bg-carbon px-2 py-0.5 text-xs font-medium text-chrome-silver whitespace-nowrap transition-[color] focus-visible:border-signal-red focus-visible:ring-[3px] focus-visible:ring-signal-red/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-signal-red text-pure-white [a&]:hover:bg-deep-red",
        secondary:
          "bg-iron text-chrome-silver [a&]:hover:bg-steel",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 [a&]:hover:bg-destructive/90",
        outline:
          "border-iron text-pure-white [a&]:hover:bg-white/5 [a&]:hover:text-pure-white",
        ghost: "[a&]:hover:bg-white/5 [a&]:hover:text-pure-white",
        link: "text-signal-red underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
