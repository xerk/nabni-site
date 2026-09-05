"use client"

/**
 * THE STELE — lifecycle authority for the fixed stage (DESIGN.md §4.2, §4.6).
 *
 * Sections still call the `stele` commands from their ScrollTriggers, but
 * crossing callbacks are not a reliable source of truth: a hash jump or a
 * `window.scrollTo` skips crossings, and a broken trigger leaves the stone
 * drawn over the wrong section. So on every scroll callback, resize and
 * ScrollTrigger refresh the stage derives the zone from DOM geometry and
 * re-asserts `active`, `anchor`, `opacity`, the light mode and the contact
 * entry. Everything here is idempotent: a section calling the same commands
 * in the same tick is harmless.
 *
 *   contact       #contact top < 0.8·vh
 *   capabilities  its stone anchor exists, the section's bottom > 0 and its
 *                 top < 0.5·vh — or the pinned hero has unpinned and is
 *                 leaving (the slab is already on the capabilities column)
 *   hero          #hero (or its pin spacer) bottom > 0
 *   none          otherwise: opacity 0, frameloop "never"
 */

import { gsap } from "@/lib/motion/gsap"

import {
  stele,
  steleState,
  STELE_DEFAULT_WORD,
  STELE_DEPTH,
  STELE_LIGHT,
  type SteleAnchorName,
} from "./stele-state"

export type SteleZone = SteleAnchorName | "none"

export type ZoneGeometry = {
  zone: SteleZone
  /** Capabilities exit progress 0..1 over the section's last 40vh (0 elsewhere). */
  exit: number
}

/** `#contact` enters at `top 80%`, like the section's own trigger. */
const CONTACT_ENTER = 0.8
/** `#capabilities` takes the stone once its top is in the upper half. */
const CAPABILITIES_ENTER = 0.5
/** Section exit (§4.6): bottom from 140% → 100% of the viewport height. */
const EXIT_FROM = 1.4
const EXIT_TO = 1.0
/** Contact fade-in / stage fade-out, seconds. */
const CONTACT_FADE = 0.4

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** `--nav-h` in px (the sticky capabilities column sits at nav + 8vh). */
export function navHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--nav-h"
  )
  return parseFloat(raw) || 56
}

/** Derive the zone from the sections' live rects. Pure with respect to the stele state. */
export function deriveZone(vh: number): ZoneGeometry {
  const contact = document.getElementById("contact")
  if (contact && contact.getBoundingClientRect().top < CONTACT_ENTER * vh) {
    return { zone: "contact", exit: 0 }
  }

  const hero = document.getElementById("hero")
  const heroRect = hero ? hero.getBoundingClientRect() : null
  const parent = hero?.parentElement ?? null
  const spacer =
    parent && parent.classList.contains("pin-spacer") ? parent : null

  const capabilities = document.getElementById("capabilities")
  if (capabilities && document.getElementById("stele-anchor-capabilities")) {
    const r = capabilities.getBoundingClientRect()
    // The pinned hero has unpinned and is scrolling away: the hero timeline
    // has already carried the slab to the capabilities column.
    const unpinned = spacer !== null && heroRect !== null && heroRect.top < -1
    if (r.bottom > 0 && (r.top < CAPABILITIES_ENTER * vh || unpinned)) {
      const exit = clamp01(
        (EXIT_FROM * vh - r.bottom) / ((EXIT_FROM - EXIT_TO) * vh)
      )
      return { zone: "capabilities", exit }
    }
  }

  if (heroRect) {
    const bottom = spacer
      ? spacer.getBoundingClientRect().bottom
      : heroRect.bottom
    if (bottom > 0) return { zone: "hero", exit: 0 }
  }

  return { zone: "none", exit: 0 }
}

/**
 * Applies a derived zone to the shared state. One per stage mount; call
 * `apply()` with every fresh geometry and `reassert()` from a `stele`
 * subscription so a section's delayed write (a fade's `onComplete` calling
 * `setActive(false)` after the visitor jumped elsewhere) never wins.
 */
export class ZoneDirector {
  zone: SteleZone | null = null
  private readonly reduced: boolean
  private fade: gsap.core.Tween | null = null

  constructor(reduced: boolean) {
    this.reduced = reduced
  }

  apply(g: ZoneGeometry) {
    const { exit } = g
    // Once the capabilities exit fade has completed the stone is invisible
    // for the rest of the section: count it as gone so the loop stops there
    // (not under reduced motion, where nothing scrubs and it hides at the
    // section's end).
    const zone =
      g.zone === "capabilities" && !this.reduced && exit >= 1 ? "none" : g.zone
    const previous = this.zone
    const changed = zone !== previous
    this.zone = zone

    if (zone === "none") {
      if (changed || steleState.opacity !== 0) {
        this.killFades()
        stele.set({ opacity: 0 })
      }
      // The hero timeline parks its override at the capabilities rect; it
      // must not decide where the contact stone lands later.
      if (steleState.anchorOverride) stele.setAnchorOverride(null)
      stele.setActive(false)
      return
    }

    stele.setActive(true)

    if (zone === "contact") {
      // The hero pin's scrub keeps re-parking its override for a while after
      // a jump; the frame step ignores it here, and it is cleared as well.
      if (steleState.anchorOverride) stele.setAnchorOverride(null)
      if (changed) this.enterContact()
      else {
        this.assertAnchor()
        this.assertContactWord()
        if (!this.fade && steleState.opacity !== 1) {
          this.killFades()
          stele.set({ opacity: 1 })
        }
      }
      return
    }

    // Hero / capabilities. The hero pin drives placement through the
    // override; leave the anchor alone while it is set.
    if (!steleState.anchorOverride && steleState.anchor !== zone) {
      stele.setAnchor(zone)
    }
    if (changed && (previous === "contact" || previous === "none")) {
      this.killFades()
      this.restorePointerLight()
      if (zone === "hero") stele.set({ depth: STELE_DEPTH.rest })
    }

    if (zone === "hero") {
      if (steleState.opacity !== 1) {
        this.killFades()
        stele.set({ opacity: 1 })
      }
      return
    }

    // Capabilities: the same exit formula the section scrubs (§4.6), derived
    // from geometry so the two writers agree and a jump cannot skip it. No
    // scrubbed work under reduced motion.
    const p = this.reduced ? 0 : exit
    const opacity = p <= 0.5 ? 1 : 1 - (p - 0.5) * 2
    const depth = STELE_DEPTH.rest + (STELE_DEPTH.noon - STELE_DEPTH.rest) * p
    if (steleState.opacity !== opacity || steleState.depth !== depth) {
      if (changed) this.killFades()
      stele.set({ opacity, depth })
    }
  }

  /**
   * Called on every `stele` notification: undo a foreign `setActive(false)`,
   * fade or carve. A jump that crosses a section fires that section's
   * callbacks after this director has already applied the zone (a
   * jumped-over capabilities trigger carves its word into the contact
   * stone), and the last carve requested wins.
   */
  reassert() {
    const zone = this.zone
    if (zone === null || zone === "none") return
    if (!steleState.active) stele.setActive(true)
    this.assertAnchor()
    if (zone === "hero" && steleState.opacity !== 1) {
      this.killFades()
      stele.set({ opacity: 1 })
    }
    if (zone === "contact") {
      this.assertContactWord()
      if (!this.fade && steleState.opacity !== 1) {
        this.killFades()
        stele.set({ opacity: 1 })
      }
    }
  }

  dispose() {
    this.killFades()
  }

  /**
   * Contact entry (§4.6), by any means: the contact anchor, first light,
   * depth restored, the brief (or نبني) carved instantly, then a 400ms fade.
   */
  private enterContact() {
    const light = STELE_LIGHT.contact
    stele.setAnchor("contact")
    stele.setLight({
      az: light.az,
      el: light.el,
      mode: "fixed",
      immediate: this.reduced,
    })
    stele.set({ depth: STELE_DEPTH.rest })
    this.assertContactWord()
    this.killFades()
    if (this.reduced) {
      stele.set({ opacity: 1 })
      return
    }
    this.fade = gsap.to(steleState, {
      opacity: 1,
      duration: CONTACT_FADE,
      ease: "power2.out",
      onUpdate: () => stele.invalidate(),
      onComplete: () => {
        this.fade = null
        stele.invalidate()
      },
    })
  }

  /**
   * The slab sits on the zone's anchor. A section's late `setAnchor` (the
   * hero pin's `onLeave` after a jump straight to contact) must not move it;
   * in the hero and capabilities zones the pin's override is left alone.
   */
  private assertAnchor() {
    const zone = this.zone
    if (zone === null || zone === "none" || steleState.anchor === zone) return
    if (zone === "contact" || !steleState.anchorOverride) stele.setAnchor(zone)
  }

  /** The contact stone carries the brief (or نبني), never a capability word. */
  private assertContactWord() {
    const word = stele.getBrief() ?? STELE_DEFAULT_WORD
    if (steleState.word !== word) stele.carve(word, { instant: true })
  }

  /** Back in the hero or capabilities: the cursor is the sun again. */
  private restorePointerLight() {
    stele.setLight({ mode: "pointer" })
    stele.setPointer(steleState.pointer.x, steleState.pointer.y)
  }

  private killFades() {
    // Sections tween `stele.state.opacity` from their own callbacks; the
    // stage is the authority, so a stale fade never outlives a zone change.
    gsap.killTweensOf(steleState, "opacity")
    this.fade = null
  }
}
