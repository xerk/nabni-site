"use client"

import type { ScrollTrigger } from "@/lib/motion/gsap"

/** Where a once-only reveal starts: the element's top at 85% of the viewport (DESIGN.md §6.4). */
export const REVEAL_START = "top 85%"

export type RevealTriggerVars = {
  trigger: Element
  /** ScrollTrigger start; defaults to `REVEAL_START`. */
  start?: string
  /** Runs once, the first time the start line is at or above the scroll position. */
  onReveal?: (self: ScrollTrigger) => void
}

/**
 * ScrollTrigger vars for a once-only reveal that also completes when the
 * section is reached without ever scrolling past its start line: an instant
 * `window.scrollTo`, a hash jump, PageDown/End, the scrollbar, or a page that
 * loads already scrolled.
 *
 * ScrollTrigger fires `onEnter` (and plays an attached tween) whenever an
 * update finds the scroll position past `start`, including the update it runs
 * right after creating the trigger and the one at the end of every
 * `ScrollTrigger.refresh()`. What breaks jumps is a stale `start`: positions
 * measured before layout changed underneath them. `onRefresh` is therefore
 * the safety net (it runs after that refresh-time update, with fresh
 * positions), and `watchLayout()` in ./layout-refresh keeps positions fresh
 * when the page changes height without a resize.
 *
 * Returned as vars rather than a live trigger so a tween can own it: SplitText
 * reverts the animation returned from `onSplit` on every re-split, and a
 * trigger created on its own would outlive its tween.
 */
export function revealTrigger({
  trigger,
  start = REVEAL_START,
  onReveal,
}: RevealTriggerVars): ScrollTrigger.Vars {
  let revealed = false
  const reveal = (self: ScrollTrigger) => {
    if (revealed) return
    revealed = true
    onReveal?.(self)
  }

  return {
    trigger,
    start,
    once: true,
    onEnter: reveal,
    onRefresh: (self) => {
      if (revealed || self.scroll() < self.start) return
      const animation = self.animation
      if (animation && animation.progress() === 0 && !animation.isActive()) {
        animation.play()
      }
      reveal(self)
    },
  }
}
