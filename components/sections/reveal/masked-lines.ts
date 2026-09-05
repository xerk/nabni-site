"use client"

import { gsap, SplitText } from "@/lib/motion/gsap"

import { revealTrigger, type RevealTriggerVars } from "./trigger"
import { REVEAL } from "./tween"

/**
 * Lines start this far below their own height. The mask shows 0.1em of clip
 * room under the line box, and display ink overflows a 0.95 line box by up to
 * ~0.05em, so anything under ~116% lets glyph tops peek through before the
 * reveal plays. 120 matches the hero.
 */
const LINE_START = 120

/** Class stem for the line elements; SplitText names their masks `<stem>-mask`. */
const LINES_CLASS = "reveal-line"

/**
 * Each mask is an inline-block (margins never collapse) with 0.1em block
 * padding cancelled by a negative margin: clip room for ink that overflows
 * the line box, without changing the line pitch. Same recipe as the hero's
 * masks (components/sections/hero.tsx); Tailwind reads these literals.
 */
const MASK_CLASSES = [
  "inline-block!",
  "w-full",
  "align-top",
  "py-[0.1em]",
  "-my-[0.1em]",
  "contain-layout",
  "contain-paint",
]

/**
 * SplitText only writes `display: block` on line elements whose tag is not a
 * span; span lines (used inside phrasing content) need it from here. Word
 * wrappers are plain spans too, so this must never be a bare `span` selector:
 * a block-level word wrapper puts every word on its own "line".
 */
const LINE_CLASSES = ["block"]

export type MaskedLinesOptions = Omit<RevealTriggerVars, "onReveal"> & {
  /** Element tag for the line wrappers; `span` keeps phrasing content valid. */
  tag?: "span"
  /** SplitText's aria handling; `none` keeps the original text nodes readable. */
  aria?: "auto" | "hidden" | "none"
  /** Restore the original markup once the reveal has played. */
  revert?: boolean
}

/**
 * Masked line reveal (DESIGN.md §6.4): SplitText lines, each in its own
 * clipped mask, rising into place 40ms apart. Jump-safe via `revealTrigger`;
 * re-splits on font load and width changes (`autoSplit`), rebuilding the
 * tween and its trigger each time.
 */
export function maskedLines(
  targets: HTMLElement | HTMLElement[],
  { trigger, start, tag, aria, revert }: MaskedLinesOptions
) {
  return SplitText.create(targets, {
    type: "lines",
    mask: "lines",
    linesClass: LINES_CLASS,
    autoSplit: true,
    tag,
    aria,
    onSplit: (self) => {
      self.masks.forEach((mask) => mask.classList.add(...MASK_CLASSES))
      self.lines.forEach((line) => line.classList.add(...LINE_CLASSES))
      return gsap.from(self.lines, {
        yPercent: LINE_START,
        ...REVEAL,
        stagger: 0.04,
        scrollTrigger: revealTrigger({ trigger, start }),
        onComplete: revert ? () => self.revert() : undefined,
      })
    },
  })
}
