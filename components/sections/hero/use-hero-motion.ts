"use client"

/**
 * Hero motion — DESIGN.md §4.6 (hero scroll, coarse hero, early-scroll rule),
 * §6.1 (load sequence, DOM part) and §6.5 (reduced motion).
 *
 * Two GSAP matchMedia contexts, deliberately separate:
 *   1. the load sequence, keyed only on reduced motion, so a width change
 *      never replays the headline reveal;
 *   2. the scroll behaviour, keyed on pointer type, width and reduced motion.
 *
 * Everything the stone does goes through the `stele` command API.
 */

import * as React from "react"

import {
  stele,
  STELE_DEFAULT_WORD,
  STELE_WORDS,
  type Rect,
} from "@/components/stele/stele-state"
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap"

/** The load ripple is over by ~1.9s; scrolling before that completes it. */
const LOAD_GRACE_MS = 1900
/** The slab opens at 18° and settles square as the hero pins (radians). */
const YAW_START = (18 * Math.PI) / 180
/** Pin length as a fraction of the viewport height (`end: "+=150%"`). */
const PIN_LENGTH = 1.5
/** The H1 narrows and lifts by this much of the viewport over the first beat. */
const H1_RISE_VH = 0.08
/** Progress at which the stone starts travelling to the capabilities rect. */
const TRAVEL_START = 0.45
/** The scrubbed travel counts as landed from here (float slack). */
const LANDED = 0.999

function navHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--nav-h"
  )
  return parseFloat(raw) || 56
}

/**
 * Deterministic "stuck" rect of the capabilities stone (DESIGN.md §4.6):
 * cols 9–12 × 22vw, portrait 2:3, top = nav + 8vh. Left and size are taken
 * from the live capabilities anchor when it exists (they do not depend on
 * scroll); only `top` is computed, because a sticky element's measured top
 * depends on where the page is.
 */
function capabilitiesStuckRect(): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const y = navHeightPx() + 0.08 * vh
  const live = document.getElementById("stele-anchor-capabilities")
  const r = live?.getBoundingClientRect()
  if (r && r.width > 0) {
    return { x: r.left, y, width: r.width, height: r.height || r.width * 1.5 }
  }
  // Mirrors --gutter: clamp(1.25rem, 4vw, 4rem) and grid-12's column-gap.
  const gutter = gsap.utils.clamp(20, 64, 0.04 * vw)
  const gap = gsap.utils.clamp(16, 32, 0.02 * vw)
  const col = (vw - 2 * gutter - 11 * gap) / 12
  const width = 0.22 * vw
  return { x: gutter + 8 * (col + gap), y, width, height: width * 1.5 }
}

export function useHeroMotion(sectionRef: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return
      const h1 = section.querySelector<HTMLElement>("[data-hero-h1]")
      const stone = section.querySelector<HTMLElement>("[data-hero-stone]")
      const anchor = section.querySelector<HTMLElement>("#stele-anchor-hero")
      const readout = section.querySelector<HTMLElement>("[data-hero-readout]")
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]", section)
      if (!h1 || !stone || !anchor) return

      const mountedAt = performance.now()
      const withinGrace = () => performance.now() - mountedAt < LOAD_GRACE_MS

      let lineReveal: gsap.core.Tween | null = null
      let fadeUps: gsap.core.Tween | null = null
      let loadDone = false
      /** Nothing is ever half-made: jump the DOM load sequence to its end. */
      const finishLoad = () => {
        loadDone = true
        lineReveal?.progress(1)
        fadeUps?.progress(1)
      }

      const mm = gsap.matchMedia()

      /* ---------------------------------------------------------------
         1. Load sequence (§6.1). Reduced motion: nothing runs, and the
            `motion-safe:` classes never hid anything, so everything is
            at its final state at first paint.
         --------------------------------------------------------------- */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(h1, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "hero-line",
          onSplit: (self) => {
            // The H1 is hidden until it is split so the reveal plays once.
            gsap.set(h1, { opacity: 1 })
            // 120%, not 100%: each mask has 0.1em of clip room top and bottom
            // (see hero.tsx), so a line parked at exactly 100% would show the
            // tops of its caps through the mask's bottom padding before rising.
            lineReveal = gsap.from(self.lines, {
              yPercent: 120,
              "--wdth": 60,
              duration: 0.9,
              ease: "lift",
              stagger: 0.11,
              delay: 0.35,
              onComplete: () => {
                // Hand the width axis back to the H1 so the scroll timeline
                // (which writes --wdth on the H1) reaches the lines again.
                for (const line of self.lines) {
                  ;(line as HTMLElement).style.removeProperty("--wdth")
                }
              },
            })
            // A split that lands after the visitor already scrolled (fonts
            // arriving late) must not replay the reveal mid-scroll.
            if (loadDone) lineReveal.progress(1)
            // Returned so autoSplit can restore the playhead on a re-split.
            return lineReveal
          },
        })

        fadeUps = gsap.fromTo(
          fades,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "studio",
            stagger: 0.06,
            delay: 1.5,
          }
        )

        return () => {
          split.revert()
          lineReveal = null
          fadeUps = null
        }
      })

      /* ---------------------------------------------------------------
         2. Scroll behaviour (§4.6).
         --------------------------------------------------------------- */
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
          wide: "(min-width: 1024px)",
        },
        (ctx) => {
          const { fine, reduce, wide } = ctx.conditions as Record<
            string,
            boolean
          >

          /** Where the slab goes once the hero has scrolled away (unpinned paths). */
          const handoff = () =>
            ScrollTrigger.create({
              trigger: section,
              start: "top top",
              end: "bottom top",
              onLeave: () => stele.setAnchor("capabilities"),
              onEnterBack: () => stele.setAnchor("hero"),
            })

          if (reduce) {
            // No pins, no scrubs, no scroll carve: the stone reads نبني
            // until something is typed (§4.10).
            handoff()
            return
          }

          if (!(fine && wide)) {
            /* ---- Coarse pointer, or a narrow fine-pointer window: flow ---- */
            ScrollTrigger.create({
              trigger: stone,
              start: "top 30%",
              once: true,
              onEnter: () => {
                if (withinGrace()) stele.finishCarve()
                stele.carve(stele.state.brief ?? STELE_WORDS.scroll, {
                  duration: 0.9,
                })
              },
            })
            handoff()
            return
          }

          /* ---- Fine pointer, ≥1024: pinned 150vh, scrub 0.6 ----
             0.00–0.40  H1 wdth 118 → 50 and rises 8vh; slab yaw 18° → 0;
                        WE BUILD carve fires once past 0.05 (clocked).
             0.45–1.00  the slab (and its readout) travel from the hero rect
                        to the capabilities stone's stuck rect, inside
                        cols 8–12. Nothing in the left column fades: the
                        section scrolls away as a whole when the pin ends. */
          let heroRect: Rect = { x: 0, y: 0, width: 0, height: 0 }
          let stuck: Rect = capabilitiesStuckRect()

          // The pinned section sits at top:0, so the anchor's rect at pin
          // start is its offset inside the section. Scroll-independent.
          const measure = () => {
            const a = anchor.getBoundingClientRect()
            const s = section.getBoundingClientRect()
            heroRect = {
              x: a.left,
              y: a.top - s.top,
              width: a.width,
              height: a.height,
            }
            stuck = capabilitiesStuckRect()
          }

          // The readout sits under the anchor, end-aligned (hero.tsx); it
          // follows the slab by its end edge and bottom edge, so the same
          // `mt-3` gap holds under the travelling stone.
          const setReadoutX = readout
            ? (gsap.quickSetter(readout, "x", "px") as (v: number) => void)
            : null
          const setReadoutY = readout
            ? (gsap.quickSetter(readout, "y", "px") as (v: number) => void)
            : null

          const proxy = { t: 0 }
          const lerp = gsap.utils.interpolate
          /** The trigger has passed its end (the hero is unpinned). */
          let left = false
          /** The override is released; the stage owns placement from here. */
          let handedOff = false

          const handOff = () => {
            if (handedOff) return
            handedOff = true
            // The stone goes to the capabilities column unless another
            // writer already claimed it (a jump straight to #contact lands
            // the contact entry before this runs): then only release the
            // override, never overwrite their anchor.
            if (stele.state.anchor === "hero") stele.setAnchor("capabilities")
            else stele.setAnchorOverride(null)
          }

          const writeRect = (t: number) => {
            if (handedOff) return
            if (t <= 0) {
              stele.setAnchorOverride(null)
              setReadoutX?.(0)
              setReadoutY?.(0)
              return
            }
            // The scrub's ease ends a hair short of 1: land on the exact rect.
            const landed = t >= LANDED
            const k = landed ? 1 : t
            stele.setAnchorOverride(
              landed
                ? { ...stuck }
                : {
                    x: lerp(heroRect.x, stuck.x, k),
                    y: lerp(heroRect.y, stuck.y, k),
                    width: lerp(heroRect.width, stuck.width, k),
                    height: lerp(heroRect.height, stuck.height, k),
                  }
            )
            setReadoutX?.(
              lerp(0, stuck.x + stuck.width - (heroRect.x + heroRect.width), k)
            )
            setReadoutY?.(
              lerp(
                0,
                stuck.y + stuck.height - (heroRect.y + heroRect.height),
                k
              )
            )
            // Scrub lag: the trigger can leave before the smoothed travel
            // has landed. Hand off only once the slab is on the rect, so the
            // stage never sees a snap.
            if (left && landed) handOff()
          }

          let carved = false
          let early = false

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: `+=${PIN_LENGTH * 100}%`,
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: measure,
              // Raw progress: the clocked events fire from here, not from
              // the smoothed timeline.
              onUpdate: (self) => {
                const p = self.progress
                if (!early && p > 0.02) {
                  early = true
                  if (withinGrace()) stele.finishCarve()
                  finishLoad()
                }
                if (!carved && p > 0.05) {
                  carved = true
                  stele.carve(stele.state.brief ?? STELE_WORDS.scroll, {
                    duration: 1.1,
                  })
                } else if (carved && p < 0.05) {
                  carved = false
                  stele.carve(STELE_DEFAULT_WORD, { duration: 1.1 })
                }
              },
              onLeave: (self) => {
                left = true
                // An instant jump past the hero (scrollTo, a hash): finish the
                // scrub now so the override never glides across other sections
                // while the hero is off screen. Once unpinned the section sits
                // at [end, end + height] in the document, so it is fully above
                // the viewport from `end + height` on. (Its own rect is not
                // reliable here: the pin styles land after this callback.)
                if (self.scroll() >= self.end + section.offsetHeight) {
                  self.getTween()?.progress(1)
                }
                if (proxy.t >= LANDED) handOff()
              },
              onEnterBack: () => {
                left = false
                handedOff = false
                stele.setAnchor("hero")
                // setAnchor cleared the override; re-emit it before the
                // stele can measure the live hero rect for a frame.
                writeRect(proxy.t)
              },
            },
          })

          measure()

          tl.fromTo(
            h1,
            { "--wdth": 118 },
            { "--wdth": 50, duration: 0.4, immediateRender: false },
            0
          )
            .to(
              h1,
              { y: () => -H1_RISE_VH * window.innerHeight, duration: 0.4 },
              0
            )
            .fromTo(
              stele.state,
              { yaw: YAW_START },
              {
                yaw: 0,
                duration: 0.4,
                immediateRender: false,
                onUpdate: () => stele.invalidate(),
              },
              0
            )
            .to(
              proxy,
              {
                t: 1,
                duration: 1 - TRAVEL_START,
                onUpdate: () => writeRect(proxy.t),
              },
              TRAVEL_START
            )

          // Loaded already scrolled past the hero: hand off explicitly rather
          // than trusting onLeave to fire at creation.
          if (tl.scrollTrigger && tl.scrollTrigger.progress >= 1) {
            left = true
            handOff()
          }

          return () => {
            // Quick-setter writes are not context-tracked; leave the DOM and
            // the stone as this branch found them.
            stele.setAnchorOverride(null)
            if (readout) gsap.set(readout, { clearProps: "transform" })
          }
        }
      )
    },
    { scope: sectionRef }
  )
}
