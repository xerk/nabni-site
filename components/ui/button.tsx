import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Buttons are blocks of the opposite ground (DESIGN.md §6.4): inversion swap
 * on hover in 160ms, display type, zero radius, 44px tall by default.
 * Keyboard focus uses the global :focus-visible outline, not a ring.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border bg-clip-padding type-button whitespace-nowrap transition-[background-color,color,border-color] duration-[160ms] ease-(--ease-studio) select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Opposite-ground block; hover inverts back. */
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground",
        /** The primary CTA: the page's one Aldebaran fill (Palm ground only). */
        sun: "border-primary bg-primary text-primary-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground",
        outline:
          "border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-foreground/10",
        link: "h-auto border-transparent bg-transparent px-0 text-foreground underline decoration-(--line) underline-offset-4 hover:decoration-current",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
        sm: "h-9 gap-1.5 px-4 text-[0.875rem] has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        lg: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
