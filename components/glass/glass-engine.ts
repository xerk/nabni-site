"use client"

import { gsap } from "@/lib/motion/gsap"
import { buildGlassWord, type GlassWord } from "@/lib/glass/geometry"
import { getFixedWord, shapeWord } from "@/lib/glass/shape-client"

import {
  stele,
  steleState,
  STELE_DEFAULT_WORD,
  type CarveOptions,
  type SteleDriver,
} from "../stele/stele-state"

/**
 * THE GLASS WORD — engine (DESIGN.md §V3).
 *
 * Owns the word currently cast in glass, the word being replaced, and the two
 * progress values the scene reads every frame. It registers the same driver
 * the relief used, so every section keeps calling `stele.carve(text)` and the
 * command now casts glass instead of carving stone.
 *
 * One engine per page; each canvas mount registers itself for invalidation, so
 * the fixed stage and the two in-flow mobile canvases share one word.
 */

export type GlassMount = { invalidate(): void }

const NOTIFY_MS = 100

class GlassEngine {
  private mounts = new Set<GlassMount>()
  private tween: gsap.core.Tween | null = null
  private lastNotify = 0
  private pending: string | null = null

  /** The word on screen. */
  current: GlassWord | null = null
  /** The word being replaced; rendered only while `dissolve` < 1. */
  outgoing: GlassWord | null = null
  /** 0 → scattered, 1 → assembled. */
  assemble = 1
  /** 0 → outgoing intact, 1 → outgoing gone. */
  dissolve = 1
  /** Bumped whenever the geometry set changes, so the scene can rebuild. */
  version = 0

  addMount(mount: GlassMount) {
    this.mounts.add(mount)
    if (this.mounts.size === 1) {
      const driver: SteleDriver = {
        carve: (text, opts) => {
          void this.cast(text, opts)
        },
        finishCarve: () => this.finishCast(),
        invalidate: () => this.invalidateAll(),
      }
      stele.registerDriver(driver)
      // The load word: pre-shaped, so the first frame never waits.
      if (!this.current) this.setWord(STELE_DEFAULT_WORD, true)
    }
    return () => this.removeMount(mount)
  }

  removeMount(mount: GlassMount) {
    this.mounts.delete(mount)
    if (this.mounts.size === 0) stele.registerDriver(null)
  }

  invalidateAll() {
    for (const mount of this.mounts) mount.invalidate()
  }

  /** Push glyph and triangle counts into the shared state for the readout. */
  private notify(force = false) {
    const now = performance.now()
    if (!force && now - this.lastNotify < NOTIFY_MS) return
    this.lastNotify = now
    steleState.raised = this.current?.glyphs.length ?? 0
    steleState.total = this.current?.triangles ?? 0
    stele.notify()
  }

  private setWord(text: string, instant: boolean) {
    const fixed = getFixedWord(text)
    if (!fixed) return false
    this.apply(buildGlassWord(fixed), instant)
    return true
  }

  private apply(word: GlassWord, instant: boolean) {
    this.tween?.kill()
    // `stele.carve()` has already written the text into shared state; the
    // engine only owns the geometry.
    this.outgoing = instant ? null : this.current
    this.current = word
    this.version++

    if (instant) {
      this.assemble = 1
      this.dissolve = 1
      this.notify(true)
      this.invalidateAll()
      return
    }

    this.assemble = 0
    this.dissolve = 0
    this.tween = gsap.to(this, {
      assemble: 1,
      dissolve: 1,
      duration: 1.05,
      ease: "carve",
      onUpdate: () => {
        this.notify()
        this.invalidateAll()
      },
      onComplete: () => {
        this.outgoing = null
        this.version++
        this.notify(true)
        this.invalidateAll()
      },
    })
  }

  /**
   * Cast `text` in glass. Fixed words resolve synchronously; anything else
   * loads the shaper once, so a fast typist never queues two casts.
   */
  async cast(text: string, opts: CarveOptions = {}) {
    const clean = text.trim()
    if (!clean) return
    const instant = opts.instant === true

    if (this.setWord(clean, instant)) return

    this.pending = clean
    const shaped = await shapeWord(clean)
    // A later keystroke won this race; drop this result.
    if (!shaped || this.pending !== clean) return
    this.pending = null
    this.apply(buildGlassWord(shaped), instant)
  }

  /** Nothing is ever half-cast: jump a running transition to its end. */
  finishCast() {
    if (this.tween?.isActive()) this.tween.progress(1)
  }
}

export const glassEngine = new GlassEngine()

/**
 * Compatibility shim for the canvas host (components/stele/stele-canvas.tsx).
 *
 * The canvas was written against the relief engine and still owns mounting,
 * zones, placement and the SVG crossfade — all of which the glass word reuses
 * unchanged. Only the parts that were specific to the cell relief (tiers, the
 * ripple schedule, the mask fallback) become no-ops here.
 */
export const RIPPLE_AT_MS = 1000

export const steleEngine = {
  attach(mount: GlassMount, _tier?: unknown) {
    void _tier
    glassEngine.addMount(mount)
  },
  detach(mount: GlassMount) {
    glassEngine.removeMount(mount)
  },
  /** The glass word's placeholder is an outline, always present; nothing to arm. */
  enableSvgFallback() {},
  /** The load reveal is the glyph assembly, driven by the first cast. */
  scheduleRipple(_at: number) {
    void _at
  },
  setTier(_tier: unknown) {
    void _tier
  },
  notify(_force?: boolean) {
    void _force
    glassEngine.invalidateAll()
  },
  update() {},
}
