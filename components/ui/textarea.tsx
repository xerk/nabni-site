import * as React from "react"
import { cn } from "cn"

/**
 * Textareas follow Input: a ruled underline, no box, no radius.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
