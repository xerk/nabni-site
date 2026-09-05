"use client"

/**
 * The hero input — DESIGN.md §5.2 (content), §6.4 ("Cast it" stamp, input
 * focus draw), §6.5 (reduced motion).
 *
 * A ruled line in display type under a question. No box, no icon, no pill.
 * The text goes only to the glass word (and, on "Cast it", to sessionStorage for
 * the contact form). It is never sent anywhere.
 */

import * as React from "react"

import {
  stele,
  STELE_DEFAULT_WORD,
  useSteleSnapshot,
} from "@/components/stele/stele-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { gsap, useGSAP } from "@/lib/motion/gsap"
import { cn } from "@/lib/utils"

const QUESTION = "What do you want to build?"
const CARVE = "Cast it"

/** Placeholder briefs, cycled every 3s (§5.2). */
const BRIEFS = [
  "a commodities trading platform",
  "an Arabic-first real-estate marketplace",
  "ZATCA Phase 2 e-invoicing for an e-commerce stack",
  "a RAG assistant over 40,000 Arabic contracts",
  "an air-quality sensor network with live alerts",
] as const

const CYCLE_S = 3
/**
 * Placeholder swap: the outgoing brief is gone before the next one appears
 * (two are never legible together); out + in = 320ms.
 */
const SWAP_S = 0.16
const DEBOUNCE_MS = 300
const CARVE_S = 1.1

/** Input type role (§3.2): Anybody 500, 1.5rem (1.25rem <768px), wdth 100. */
const inputType =
  "font-display wdth-axis text-[1.25rem] leading-[1.3] font-medium md:text-[1.5rem]"

type Cycle = { pause: () => void; resume: () => void }

export function HeroInput({ className }: { className?: string }) {
  const id = React.useId()
  const reduced = useReducedMotion()
  const { tier } = useSteleSnapshot()
  const maxLength = tier === "B" ? 24 : 40

  const rootRef = React.useRef<HTMLFormElement>(null)
  const layerA = React.useRef<HTMLSpanElement>(null)
  const layerB = React.useRef<HTMLSpanElement>(null)
  const lineRef = React.useRef<SVGLineElement>(null)
  const labelRef = React.useRef<HTMLSpanElement>(null)
  const cycleRef = React.useRef<Cycle | null>(null)
  const debounceRef = React.useRef<number | undefined>(undefined)

  const [value, setValue] = React.useState("")

  React.useEffect(() => () => window.clearTimeout(debounceRef.current), [])

  useGSAP(
    () => {
      const a = layerA.current
      const b = layerB.current
      const line = lineRef.current
      const label = labelRef.current
      // Tweens started from event handlers below die with the component.
      const killHandlerTweens = () =>
        gsap.killTweensOf([line, label].filter(Boolean))

      if (reduced || !a || !b) {
        cycleRef.current = null
        return killHandlerTweens
      }

      // Swap the placeholder through two layers, out then in; stops on focus.
      const layers = [a, b]
      let index = 0
      let front = 0
      let call: gsap.core.Tween | null = null
      let swap: gsap.core.Timeline | null = null

      const tick = () => {
        index = (index + 1) % BRIEFS.length
        const outgoing = layers[front]
        const incoming = layers[1 - front]
        incoming.textContent = BRIEFS[index]
        swap?.kill()
        swap = gsap
          .timeline()
          .to(outgoing, { opacity: 0, duration: SWAP_S, ease: "studio" })
          .to(incoming, { opacity: 1, duration: SWAP_S, ease: "studio" })
        front = 1 - front
        schedule()
      }
      const schedule = () => {
        call?.kill()
        call = gsap.delayedCall(CYCLE_S, tick)
      }

      cycleRef.current = {
        pause: () => {
          call?.kill()
          call = null
        },
        resume: () => {
          if (!call) schedule()
        },
      }
      schedule()

      return () => {
        call?.kill()
        swap?.kill()
        cycleRef.current = null
        killHandlerTweens()
      }
    },
    { scope: rootRef, dependencies: [reduced] }
  )

  const carve = React.useCallback(
    (text: string) => {
      const clean = text.trim()
      const word = clean || (stele.state.brief ?? STELE_DEFAULT_WORD)
      stele.carve(word, { duration: CARVE_S, instant: reduced })
    },
    [reduced]
  )

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => carve(next), DEBOUNCE_MS)
  }

  /** "Cast it": label compresses wdth 100 → 70 → 100 over 240ms, like a stamp. */
  const stamp = () => {
    const label = labelRef.current
    if (!label || reduced) return
    const width = label.offsetWidth // one read; the button keeps its width
    gsap
      .timeline()
      .set(label, { width })
      .to(label, { "--wdth": 70, duration: 0.12, ease: "studio" })
      .to(label, { "--wdth": 100, duration: 0.12, ease: "studio" })
      .set(label, { clearProps: "width" })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.clearTimeout(debounceRef.current)
    const clean = value.trim()
    stele.setBrief(clean || null)
    carve(clean)
    stamp()
  }

  /** Focus: the underline draws in reading direction (DrawSVG, 200ms). */
  const onFocus = () => {
    cycleRef.current?.pause()
    const line = lineRef.current
    if (!line) return
    if (reduced) {
      gsap.set(line, { autoAlpha: 1, drawSVG: "100%" })
      return
    }
    gsap.set(line, { autoAlpha: 1 })
    gsap.fromTo(
      line,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: 0.2, ease: "studio", overwrite: true }
    )
  }

  const onBlur = () => {
    if (value === "") cycleRef.current?.resume()
    const line = lineRef.current
    if (!line) return
    if (reduced) {
      gsap.set(line, { autoAlpha: 0 })
      return
    }
    gsap.to(line, {
      autoAlpha: 0,
      duration: 0.16,
      ease: "studio",
      overwrite: true,
    })
  }

  return (
    <form
      ref={rootRef}
      className={cn("flex flex-col", className)}
      onSubmit={onSubmit}
      noValidate
    >
      <h3 data-hero-fade className="type-h3 motion-safe:opacity-0">
        <label htmlFor={id}>{QUESTION}</label>
      </h3>

      <div
        data-hero-fade
        className="mt-1 flex flex-col gap-3 motion-safe:opacity-0 md:flex-row md:items-end md:gap-4"
      >
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            name="brief"
            type="text"
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            maxLength={maxLength}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="go"
            className={cn(
              inputType,
              "truncate [--wdth:100] focus-visible:border-input"
            )}
          />

          {/* Visual placeholder: two layers crossfaded by GSAP. The label above is the accessible name. */}
          <div
            aria-hidden="true"
            hidden={value !== ""}
            className={cn(
              inputType,
              "pointer-events-none absolute inset-0 grid items-center pb-px text-muted-foreground [--wdth:100]"
            )}
          >
            <span ref={layerA} className="col-start-1 row-start-1 truncate">
              {BRIEFS[0]}
            </span>
            <span
              ref={layerB}
              className="col-start-1 row-start-1 truncate opacity-0"
            />
          </div>

          {/* Focus underline, drawn start → end over the resting Mist rule. */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute start-0 end-0 bottom-0 h-px w-full overflow-visible text-foreground"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
          >
            <line
              ref={lineRef}
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              className="opacity-0"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>

        <Button
          type="submit"
          variant="default"
          className="self-start md:self-auto"
        >
          <span
            ref={labelRef}
            className="inline-block text-center wdth-axis"
            style={{ "--wdth": 100 } as React.CSSProperties}
          >
            {CARVE}
          </span>
        </Button>
      </div>
    </form>
  )
}
