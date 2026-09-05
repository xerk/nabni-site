import Link from "next/link"

import { Section } from "@/components/sections/primitives"
import { Button } from "@/components/ui/button"

/**
 * 404 — the root not-found boundary. Server component: no hooks, no stele.
 * Copy per DESIGN.md §7: plain, sentence case, says what happened and where
 * to go. Rendered inside the root layout, so the frame (cursor, smooth
 * scroll, toaster) stays intact.
 */
export default function NotFound() {
  return (
    <Section
      id="not-found"
      ground="night"
      className="flex min-h-svh flex-col justify-center gutter section-pad"
    >
      <div className="flex flex-col items-start gap-8">
        <h1 className="type-display">Nothing carved here.</h1>
        <p className="measure type-body text-muted-foreground">
          The page you asked for does not exist.
        </p>
        <Button
          variant="default"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back to the front
        </Button>
      </div>
    </Section>
  )
}
