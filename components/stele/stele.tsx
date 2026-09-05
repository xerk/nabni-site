"use client"

/**
 * STELE COMPONENT CONTRACT (DESIGN.md §4).
 *
 * Sections use exactly these three components plus the `stele` commands in
 * ./stele-state.ts. Props must not change; implementations may.
 *
 *   <SteleStage />
 *     Mounted once in app/page.tsx. On fine pointers it renders the single
 *     fixed full-viewport WebGL canvas (z-10, above the section grounds and
 *     below the nav) whose slab is placed on the current anchor's rect.
 *     Renders nothing on coarse pointers and on the server.
 *
 *   <SteleAnchor name="hero" | "capabilities" | "contact" className style />
 *     An empty box the slab is placed onto. Renders the server-side SVG
 *     placeholder of the نبني mask inside it (crossfaded out once the canvas
 *     is ready). On coarse pointers, "hero" and "contact" anchors also mount
 *     an in-flow canvas clipped to the box; "capabilities" renders no stone.
 *     Size it with className (aspect, width, height); the slab fits the box
 *     (portrait 2:3 inside, centred).
 *
 *   <SteleReadout className />
 *     The mono line `{word} · {raised}/{total} cells · light {az}° {el}°`.
 *     Server output shows only the word. Sections position it.
 */

import * as React from "react"
import dynamic from "next/dynamic"

import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

import { useFontsReady } from "./stele-fonts"
import {
  formatReadout,
  stele,
  STELE_DEFAULT_WORD,
  steleState,
  useSteleSnapshot,
  type SteleAnchorName,
} from "./stele-state"
import { GlassSvg } from "../glass/glass-svg"

const SteleStageCanvas = dynamic(
  () => import("./stele-canvas").then((m) => m.SteleStageCanvas),
  {
    ssr: false,
  }
)
const SteleInflowCanvas = dynamic(
  () => import("./stele-canvas").then((m) => m.SteleInflowCanvas),
  {
    ssr: false,
  }
)


function useReady(): boolean {
  return React.useSyncExternalStore(
    stele.subscribe,
    () => steleState.ready,
    () => false
  )
}

export type SteleAnchorProps = {
  name: SteleAnchorName
  className?: string
  style?: React.CSSProperties
}

export function SteleAnchor({ name, className, style }: SteleAnchorProps) {
  const coarse = useMediaQuery("(pointer: coarse)")
  const fontsReady = useFontsReady()
  const globalReady = useReady()
  const [localReady, setLocalReady] = React.useState(false)
  // The canvas mounts after document.fonts.ready (§6.1); the SVG is the first paint.
  const inflow = coarse && fontsReady && name !== "capabilities"
  const ready = inflow ? localReady : globalReady
  const onReady = React.useCallback(() => setLocalReady(true), [])
  // The placeholder shows whatever word the glass is currently cast in, so
  // the crossfade and the no-WebGL path always agree with the canvas.
  const word = React.useSyncExternalStore(
    stele.subscribe,
    () => steleState.word,
    () => STELE_DEFAULT_WORD
  )

  return (
    <div
      id={`stele-anchor-${name}`}
      data-stele-anchor={name}
      data-ready={ready ? "true" : "false"}
      data-cursor="stone"
      className={cn("stele-anchor group relative", className)}
      // `.stele-anchor` is pointer-events: none in globals.css (unlayered); the
      // sun cursor needs to hover the stone's rect, so the box takes events.
      style={{ pointerEvents: "auto", ...style }}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden transition-[opacity,visibility] duration-200 ease-(--ease-studio)",
          "group-data-[ready=true]:invisible group-data-[ready=true]:opacity-0",
          name === "capabilities" && "pointer-coarse:hidden"
        )}
      >
        <GlassSvg
          word={word}
          className="block size-full p-[8%]"
        />
      </div>
      {inflow ? <SteleInflowCanvas anchor={name} onReady={onReady} /> : null}
    </div>
  )
}

export function SteleStage() {
  const fine = useMediaQuery("(pointer: fine)")
  const fontsReady = useFontsReady()
  if (!fine || !fontsReady) return null
  return (
    <>
      <SteleStageCanvas />
      <p className="sr-only">
        A glass sculpture of the word &lsquo;we build&rsquo; in Arabic; it
        re-casts to whatever you type above.
      </p>
    </>
  )
}

export function SteleReadout({ className }: { className?: string }) {
  const state = useSteleSnapshot()
  const line = formatReadout(state)
  const rest = line.startsWith(state.word)
    ? line.slice(state.word.length)
    : line
  const word = rest === line ? "" : state.word
  return (
    // The page reads LTR; the word is a bidi-isolated run so an Arabic word never
    // flips the whole line. Arabic falls back to Plex Sans Arabic 500 (§3.2).
    <p
      className={cn(
        // 13px / wdth 90; 11px / wdth 75 below 768px (§3.2 mono).
        // It only stays on one line from lg up. Below that a long brief makes
        // the line wider than the screen, and an over-wide child grows the
        // layout viewport itself, pushing the nav off the right edge.
        "type-mono max-w-full text-muted-foreground [overflow-wrap:anywhere] max-md:text-[0.6875rem] max-md:[--wdth:75] lg:whitespace-nowrap",
        className
      )}
      dir="ltr"
    >
      {word ? (
        <bdi
          className={
            state.script === "arabic" ? "ar font-sans font-medium" : undefined
          }
        >
          {word}
        </bdi>
      ) : null}
      {rest}
    </p>
  )
}
