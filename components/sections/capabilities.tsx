"use client"

import * as React from "react"

import { useLenis } from "@/components/providers/smooth-scroll"
import { Eyebrow, Section } from "@/components/sections/primitives"
import { SteleAnchor, SteleReadout } from "@/components/stele/stele"
import { stele, STELE_DEPTH, STELE_LIGHT } from "@/components/stele/stele-state"
import { capabilities } from "@/content/capabilities"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap"

import { LedgerSlot, LedgerStack, Legend } from "./capabilities/ledger"
import {
  guardedReach,
  LENS_BAND,
  LENS_HYSTERESIS,
  LENS_MAX_NARROW,
  LENS_MAX_WIDE,
  LENS_MIN,
  LENS_REACH,
  lensWidth,
  nearestTwo,
  type LensRange,
} from "./capabilities/lens"

/**
 * CAPABILITIES — What we build (the width lens). DESIGN.md §5.3, §4.6, §6.4, §6.5.
 *
 * Five words, five buttons. Width equals attention: the word nearest the
 * viewport's centre band is a slab (wdth 150), the rest are spires (50), and
 * the stone in the sticky column carves whatever is active.
 *
 * Two layouts, decided in React so the ledger lives in exactly one place:
 *   column   fine pointer ≥768px: words in cols 1–8, sticky stone column in
 *            cols 9–12 holding anchor, readout, crossfading ledger, legend.
 *   stacked  coarse pointer or <768px: words full width, the active word's
 *            ledger opens directly under it, legend after the list.
 * Reduced motion: every word at wdth 110, every ledger open, no lens.
 *
 * Motion is decided in gsap.matchMedia. Nothing here is React state on the
 * scroll path: the lens writes --wdth, aria-pressed and data-* straight to
 * the DOM through refs and quickSetters.
 */

const WIDE: LensRange = { min: LENS_MIN, max: LENS_MAX_WIDE }
const NARROW: LensRange = { min: LENS_MIN, max: LENS_MAX_NARROW }
const REDUCED_WDTH = 110
const LENS_CARVE_DURATION = 0.6
const LEDGER_CROSSFADE = 0.25
/** Keys that are the selection path on a word; every other key resumes the scroll binding. */
const SELECT_KEYS = new Set(["ArrowUp", "ArrowDown", "Enter", " "])

type Controller = {
  /** Keyboard/click path: set the active index, scroll it into the band, carve. */
  select: (index: number, focus?: boolean) => void
}

export function Capabilities() {
  const ref = React.useRef<HTMLElement>(null)
  const ctrl = React.useRef<Controller | null>(null)
  const active = React.useRef(0)

  const fine = useMediaQuery("(pointer: fine)")
  const md = useMediaQuery("(min-width: 768px)")
  const reduce = useReducedMotion()
  const { scrollTo } = useLenis()
  const column = fine && md

  useGSAP(
    () => {
      const section = ref.current
      if (!section) return

      const words = gsap.utils.toArray<HTMLElement>("[data-lens-word]", section)
      const buttons = gsap.utils.toArray<HTMLButtonElement>(
        "[data-lens-button]",
        section
      )
      const layers = gsap.utils.toArray<HTMLElement>(
        "[data-ledger-layer]",
        section
      )
      const slots = gsap.utils.toArray<HTMLElement>(
        "[data-ledger-slot]",
        section
      )
      const list = section.querySelector<HTMLElement>("[data-lens-list]")
      const n = capabilities.length
      if (words.length !== n || buttons.length !== n || !list) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
          md: "(min-width: 768px)",
        },
        (ctx) => {
          const { fine, reduce, md } = ctx.conditions as Record<string, boolean>
          // The stone only lives here when the sticky column is in the DOM.
          // On the hydration pass the DOM is still the server (stacked)
          // layout; the column re-render re-runs this effect.
          const stoneHere =
            fine &&
            md &&
            section.querySelector("#stele-anchor-capabilities") !== null
          // 50–150 only where the stone column exists (fine pointer, ≥768px);
          // coarse pointers and narrow windows run 50–115 (Tier B).
          const range = fine && md ? WIDE : NARROW
          let locked = false

          /* ---------------- state → DOM ---------------- */

          const carve = (index: number, instant: boolean) => {
            if (!stoneHere) return
            const word = capabilities[index].word
            if (stele.state.word === word) return
            stele.carve(
              word,
              instant ? { instant: true } : { duration: LENS_CARVE_DURATION }
            )
          }

          const paintButtons = (index: number) => {
            for (let k = 0; k < n; k++) {
              const on = k === index ? "true" : "false"
              buttons[k].setAttribute("aria-pressed", on)
              buttons[k].dataset.active = on
            }
          }

          const paintLayers = (index: number, instant: boolean) => {
            for (let k = 0; k < n; k++) {
              const el = layers[k]
              const on = k === index
              el.setAttribute("aria-hidden", on ? "false" : "true")
              if (instant) gsap.set(el, { autoAlpha: on ? 1 : 0 })
              else
                gsap.to(el, {
                  autoAlpha: on ? 1 : 0,
                  duration: LEDGER_CROSSFADE,
                  ease: "studio",
                  overwrite: "auto",
                })
            }
          }

          const paintSlots = (index: number) => {
            for (let k = 0; k < n; k++) {
              slots[k].dataset.open = reduce || k === index ? "true" : "false"
            }
          }

          const paint = (index: number, instant: boolean) => {
            paintButtons(index)
            if (layers.length === n) paintLayers(index, instant)
            if (slots.length === n) paintSlots(index)
          }

          const activate = (index: number, instant: boolean) => {
            if (index === active.current) return
            active.current = index
            paint(index, instant)
            carve(index, instant)
          }

          /* ---------------- keyboard / click ---------------- */

          const select = (index: number, focus = false) => {
            const i = gsap.utils.clamp(0, n - 1, index)
            locked = true
            if (focus) buttons[i].focus({ preventScroll: !reduce })
            activate(i, reduce)
            if (reduce) return
            const r = words[i].getBoundingClientRect()
            const top =
              window.scrollY + r.top + r.height / 2 - window.innerHeight / 2
            scrollTo(top)
          }
          ctrl.current = { select }

          // Scroll binding resumes on the next real scroll gesture. Pointer
          // and key events that start on the words are the selection path
          // itself and must not unlock ahead of `select`.
          const unlock = () => {
            locked = false
          }
          const unlockOutsideList = (e: Event) => {
            if (e.target instanceof Node && list.contains(e.target)) {
              if (!(e instanceof KeyboardEvent) || SELECT_KEYS.has(e.key))
                return
            }
            locked = false
          }
          window.addEventListener("wheel", unlock, { passive: true })
          window.addEventListener("touchstart", unlock, { passive: true })
          window.addEventListener("pointerdown", unlockOutsideList, {
            passive: true,
          })
          window.addEventListener("keydown", unlockOutsideList)
          const removeUnlock = () => {
            window.removeEventListener("wheel", unlock)
            window.removeEventListener("touchstart", unlock)
            window.removeEventListener("pointerdown", unlockOutsideList)
            window.removeEventListener("keydown", unlockOutsideList)
          }

          /* ---------------- reduced motion ---------------- */

          if (reduce) {
            gsap.set(words, { "--wdth": REDUCED_WDTH })
            paint(active.current, true)
            if (stoneHere) {
              ScrollTrigger.create({
                trigger: section,
                start: "top 95%",
                end: "bottom top",
                onEnter: () => {
                  stele.setAnchor("capabilities")
                  carve(active.current, true)
                },
                onEnterBack: () => {
                  stele.setActive(true)
                  stele.setAnchor("capabilities")
                },
                onLeave: () => stele.setActive(false),
              })
            }
            return removeUnlock
          }

          /* ---------------- the lens ---------------- */

          const setWdth = words.map(
            (el) => gsap.quickSetter(el, "--wdth") as (v: number) => void
          )
          const written = new Array<number>(n).fill(Number.NaN)
          const ease = gsap.parseEase("power2.inOut")
          const centres = new Float64Array(n)
          const dists = new Float64Array(n)
          // Stacked mode: the active word's ledger opens in flow beneath it,
          // so a hand-over reflows every word below by the ledger's height
          // without a scroll event. The lens therefore measures the words in
          // the closed layout (each word lifted by the open slots above it):
          // that keeps it monotonic in scroll, and the word just activated
          // lands exactly on the hand-over point once its predecessor's
          // ledger has closed.
          const stacked = slots.length === n

          const write = (i: number, value: number) => {
            const v = Math.round(value * 10) / 10
            if (written[i] === v) return
            written[i] = v
            setWdth[i](v)
          }

          const lens = () => {
            // Reads, batched.
            const vh = window.innerHeight
            const mid = vh / 2
            let lift = 0
            for (let i = 0; i < n; i++) {
              const r = words[i].getBoundingClientRect()
              centres[i] = r.top + r.height / 2 - lift
              dists[i] = Math.abs(centres[i] - mid)
              if (stacked) lift += slots[i].getBoundingClientRect().height
            }
            // Writes.
            const band = LENS_BAND * vh
            const [a, b] = nearestTwo(dists)
            for (let i = 0; i < n; i++) {
              if (i !== a && i !== b) {
                write(i, range.min)
                continue
              }
              const up =
                i > 0 ? centres[i] - centres[i - 1] : Number.POSITIVE_INFINITY
              const down =
                i < n - 1
                  ? centres[i + 1] - centres[i]
                  : Number.POSITIVE_INFINITY
              const reach = guardedReach(
                LENS_REACH * vh,
                band,
                Math.min(up, down)
              )
              write(i, lensWidth(dists[i], reach, band, range, ease))
            }
            if (locked || a === active.current) return
            if (dists[a] < dists[active.current] - LENS_HYSTERESIS * vh)
              activate(a, false)
          }

          paint(active.current, true)
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            onUpdate: lens,
            onRefresh: lens,
          })
          lens()

          if (!stoneHere) return removeUnlock

          /* ---------------- the stone ---------------- */

          ScrollTrigger.create({
            trigger: section,
            start: "top 95%",
            end: "bottom top",
            onEnter: () => {
              stele.setAnchor("capabilities")
              carve(active.current, false)
            },
            onEnterBack: () => stele.setAnchor("capabilities"),
          })

          // Section exit: over the last 40vh the sun climbs to noon and the
          // relief flattens; over the final 20vh the stone fades. Scrubbed
          // through a proxy in both directions: on the way down the climb
          // starts from wherever the pointer left the sun; on the way up it
          // descends to where the pointer would hold it now, and hands the
          // light back to the pointer as the zone is left.
          const proxy = { p: 0 }
          let baseEl: number = STELE_LIGHT.heroStart.el
          let baseP = 0
          let lastP = 0
          /** 1 climbing to noon, -1 descending back, 0 not driving the light. */
          let direction = 0
          // The pointer's own target, re-derived through the store so the
          // formula lives in one place.
          const pointerEl = () => {
            const { x, y } = stele.state.pointer
            stele.setLight({ mode: "pointer" })
            stele.setPointer(x, y)
            return stele.state.targetEl
          }
          const releaseLight = () => {
            pointerEl()
            direction = 0
          }
          gsap.to(proxy, {
            p: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "bottom 140%",
              end: "bottom 100%",
              scrub: true,
              onEnter: () => {
                baseEl = stele.state.el
                baseP = 0
                direction = 1
              },
              onLeave: () => stele.setActive(false),
              onEnterBack: () => {
                stele.setActive(true)
                direction = 0
              },
              onLeaveBack: releaseLight,
            },
            onUpdate: () => {
              const p = proxy.p
              const down = p > lastP
              const up = p < lastP
              lastP = p
              stele.set({
                depth:
                  STELE_DEPTH.rest + (STELE_DEPTH.noon - STELE_DEPTH.rest) * p,
                opacity: p <= 0.5 ? 1 : 1 - (p - 0.5) * 2,
              })
              if (down && direction !== 1) {
                // Direction comes from the proxy's own delta: the first update
                // can run inside gsap.to(), before onEnter.
                baseEl = stele.state.el
                baseP = p
                direction = 1
              } else if (up && direction !== -1) {
                baseEl = pointerEl()
                baseP = 0
                direction = -1
              }
              if (direction === 0) return
              const span = Math.max(1e-3, 1 - baseP)
              const t = gsap.utils.clamp(0, 1, (p - baseP) / span)
              stele.setLight({
                el: baseEl + (STELE_LIGHT.noon.el - baseEl) * t,
                mode: "fixed",
              })
            },
          })

          return removeUnlock
        }
      )
    },
    {
      scope: ref,
      dependencies: [column, reduce, scrollTo],
      revertOnUpdate: true,
    }
  )

  const onKeyDown =
    (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
      e.preventDefault()
      const next = index + (e.key === "ArrowDown" ? 1 : -1)
      if (next < 0 || next >= capabilities.length) return
      ctrl.current?.select(next, true)
    }

  const wdth = reduce ? REDUCED_WDTH : LENS_MIN

  return (
    <Section
      ref={ref}
      id="capabilities"
      ground="night"
      aria-labelledby="capabilities-label"
      className="gutter section-pad md:pointer-fine:flex md:pointer-fine:min-h-[240vh] md:pointer-fine:flex-col"
    >
      <div className="grid-12 gap-y-6 md:pointer-fine:flex-1 md:pointer-fine:grid-rows-[auto_1fr]">
        <Eyebrow
          id="capabilities-label"
          className="col-span-12 md:pointer-fine:col-span-8"
        >
          What we build
        </Eyebrow>

        {/* Column mode pads the list's end so the last word holds the band for
            a full pitch before the exit beat (the section's final 40vh) begins:
            the word's centre then sits ≈1vh above the section's bottom edge. */}
        <ul
          role="list"
          data-lens-list
          className="@container col-span-12 flex flex-col gap-[20vh] pt-[6vh] md:pointer-fine:col-span-8 md:pointer-fine:pt-[20vh] md:pointer-fine:pb-[80vh]"
        >
          {capabilities.map((c, i) => (
            <li key={c.id} className="flex flex-col">
              <button
                type="button"
                data-lens-button={c.id}
                data-active={i === 0 ? "true" : "false"}
                aria-pressed={i === 0}
                onClick={() => ctrl.current?.select(i)}
                onKeyDown={onKeyDown(i)}
                className="block w-full text-start font-bold text-dune transition-colors duration-200 ease-(--ease-studio) data-[active=true]:font-black data-[active=true]:text-sand"
              >
                <span
                  data-lens-word={c.id}
                  className="block font-display text-[length:17cqw] leading-none tracking-[-0.015em] contain-layout contain-paint wdth-axis md:pointer-fine:text-[length:13cqw]"
                  style={{ "--wdth": wdth } as React.CSSProperties}
                >
                  {c.word}
                </span>
              </button>
              {!column || reduce ? (
                <LedgerSlot capability={c} open={reduce || i === 0} />
              ) : null}
            </li>
          ))}
        </ul>

        {column ? (
          <div className="col-span-4 col-start-9 row-span-2 row-start-1 -mb-(--section-pad)">
            {/* The stone is 22vw wide, capped so the 2:3 box is at most 56vh
                tall; the text keeps the column's width and the gaps close up
                on short viewports, so readout, ledger and legend stay above
                the fold while stuck. */}
            <div className="sticky top-[calc(var(--nav-h)_+_8vh)] w-[22vw]">
              <SteleAnchor
                name="capabilities"
                className="aspect-[2/3] w-[min(100%,37.33vh)]"
              />
              <SteleReadout className="mt-3 [@media(max-height:760px)]:mt-2" />
              {reduce ? null : (
                <LedgerStack className="mt-6 [@media(max-height:760px)]:mt-3" />
              )}
              <Legend className="mt-8 [@media(max-height:760px)]:mt-4" />
            </div>
          </div>
        ) : (
          <Legend className="col-span-12 mt-[8vh]" />
        )}
      </div>
    </Section>
  )
}
