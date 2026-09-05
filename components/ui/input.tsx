import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/**
 * Inputs are ruled lines, not boxes (DESIGN.md §5.7): a 1px underline in
 * `--input`, which thickens to the foreground on focus. No radius, no fill.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-none border-0 border-b border-input bg-transparent px-0 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
