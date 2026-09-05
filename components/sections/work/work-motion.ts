"use client"

/**
 * Motion for the work list — DESIGN.md §5.4, §6.4, §6.5.
 *
 * Called once from the section's `useGSAP` context, so every matchMedia
 * context, tween, SplitText and listener created here reverts on unmount.
 *
 *   reveal   once on enter, not scrubbed: masked line reveal on the heading
 *            and the row titles (stagger 40ms), opacity/translate for the rest.
 *            Skipped under reduced motion: the server markup is already at rest.
 *   lean     hover / focus-visible on a row: title --wdth 100 → 130 over 200ms,
 *            the "on" weave cells pulse in reading order 30ms apart.
 *            Fine pointers only, never under reduced motion, and only in the
 *            single-line layout (≥768px) where the widened title cannot rewrap.
 *            The row tint is a CSS transition on the item (work-row.tsx).
 */

import {
  maskedLines,
  REVEAL,
  revealFrom,
  revealTrigger,
} from "@/components/sections/reveal"
import { gsap } from "@/lib/motion/gsap"

const WDTH_REST = 100
const WDTH_LEAN = 130

type WorkRefs = {
  eyebrow: HTMLElement | null
  heading: HTMLElement
  list: HTMLElement
  rows: HTMLElement[]
  titles: HTMLElement[]
}

export function mountWorkMotion(section: HTMLElement) {
  const heading = section.querySelector<HTMLElement>("[data-work-heading]")
  const list = section.querySelector<HTMLElement>("[data-work-list]")
  if (!heading || !list) return

  const refs: WorkRefs = {
    eyebrow: section.querySelector<HTMLElement>("[data-work-eyebrow]"),
    heading,
    list,
    rows: Array.from(list.querySelectorAll<HTMLElement>("[data-work-row]")),
    titles: Array.from(list.querySelectorAll<HTMLElement>("[data-work-title]")),
  }

  const mm = gsap.matchMedia()

  mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () =>
    reveal(refs)
  )

  mm.add(
    {
      fine: "(pointer: fine)",
      coarse: "(pointer: coarse)",
      reduce: "(prefers-reduced-motion: reduce)",
      wide: "(min-width: 768px)",
    },
    (ctx) => {
      const { fine, reduce, wide } = ctx.conditions as Record<string, boolean>
      if (!fine || reduce || !wide) return
      return bindLean(refs.list)
    }
  )
}

/* ------------------------------------------------------------------------
   Reveal
   ------------------------------------------------------------------------ */

/**
 * Masked line reveals restore the original markup once they have played
 * (`revert`): the title's `--wdth` lean and its accessible name work on the
 * plain text, and nothing is left split across a hover. The split lines
 * keep the resting line pitch, so the section is the same height before,
 * during and after the reveal, and no trigger below it goes stale.
 */
function reveal({ eyebrow, heading, list, rows, titles }: WorkRefs) {
  const headingSplit = maskedLines(heading, { trigger: heading, revert: true })
  // Titles sit inside <button> inside <h3>: span lines keep the markup
  // phrasing content; maskedLines makes only the line spans block-level.
  const titleSplit = maskedLines(titles, {
    trigger: list,
    tag: "span",
    revert: true,
  })

  if (eyebrow) {
    revealFrom(eyebrow, { autoAlpha: 0, y: 8 }, { trigger: heading })
  }

  const tl = gsap.timeline({
    defaults: REVEAL,
    scrollTrigger: revealTrigger({ trigger: list }),
  })
  rows.forEach((row, i) => {
    tl.from(
      row.querySelectorAll<HTMLElement>("[data-work-meta]"),
      { autoAlpha: 0, y: 8 },
      i * 0.04
    )
  })

  return () => {
    headingSplit.revert()
    titleSplit.revert()
  }
}

/* ------------------------------------------------------------------------
   Lean (hover / focus-visible)
   ------------------------------------------------------------------------ */

type RowState = { hover: boolean; focus: boolean }

function rowOf(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-work-row]")
    : null
}

function bindLean(list: HTMLElement) {
  const states = new WeakMap<HTMLElement, RowState>()

  const lean = (row: HTMLElement, on: boolean) => {
    const title = row.querySelector<HTMLElement>("[data-work-title]")
    if (!title) return
    gsap.to(title, {
      "--wdth": on ? WDTH_LEAN : WDTH_REST,
      duration: 0.2,
      ease: "studio",
      overwrite: "auto",
    })
  }

  const sweep = (row: HTMLElement) => {
    const cells = row.querySelectorAll<HTMLElement>(
      '[data-work-mark] [data-on="true"]'
    )
    if (!cells.length) return
    gsap.fromTo(
      cells,
      { opacity: 0.2, scale: 0.6 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.26,
        ease: "studio",
        stagger: 0.03,
        overwrite: "auto",
      }
    )
  }

  const update = (row: HTMLElement, patch: Partial<RowState>) => {
    const state = states.get(row) ?? { hover: false, focus: false }
    const was = state.hover || state.focus
    Object.assign(state, patch)
    states.set(row, state)
    const now = state.hover || state.focus
    if (now === was) return
    lean(row, now)
    if (now) sweep(row)
  }

  // pointerover/out bubble; comparing the row under `target` with the row
  // under `relatedTarget` turns them into per-row enter/leave.
  const onPointerOver = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    const to = rowOf(e.target)
    if (to && to !== rowOf(e.relatedTarget)) update(to, { hover: true })
  }
  const onPointerOut = (e: PointerEvent) => {
    const from = rowOf(e.target)
    if (from && from !== rowOf(e.relatedTarget)) update(from, { hover: false })
  }
  // Keyboard focus only, so a mouse click does not leave a row leaning.
  const onFocusIn = (e: FocusEvent) => {
    const row = rowOf(e.target)
    if (
      row &&
      e.target instanceof Element &&
      e.target.matches(":focus-visible")
    ) {
      update(row, { focus: true })
    }
  }
  const onFocusOut = (e: FocusEvent) => {
    const row = rowOf(e.target)
    if (row && row !== rowOf(e.relatedTarget)) update(row, { focus: false })
  }

  list.addEventListener("pointerover", onPointerOver)
  list.addEventListener("pointerout", onPointerOut)
  list.addEventListener("focusin", onFocusIn)
  list.addEventListener("focusout", onFocusOut)

  return () => {
    list.removeEventListener("pointerover", onPointerOver)
    list.removeEventListener("pointerout", onPointerOut)
    list.removeEventListener("focusin", onFocusIn)
    list.removeEventListener("focusout", onFocusOut)
  }
}
