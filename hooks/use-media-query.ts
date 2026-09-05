"use client"

import { useSyncExternalStore } from "react"

/**
 * Subscribe to a CSS media query without effect-driven state.
 * Server snapshot is `false`, so SSR output never assumes a device trait.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
