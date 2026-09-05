"use client"

/**
 * Link behaviour shared by the nav and the footer (DESIGN.md §6.4).
 *
 *  - `useAnchorScroll`: in-page anchors smooth-scroll through Lenis while the
 *    `href` stays intact for keyboard, middle-click and no-JS visitors.
 *  - `useLeanLinks`: hover lean. `--wdth` rest → wide over 200ms, with
 *    `min-inline-size` reserved at the wide setting so nothing around the
 *    link shifts. Fine pointers only, never under reduced motion.
 */

import * as React from "react"

import { useLenis } from "@/components/providers/smooth-scroll"
import { gsap, useGSAP } from "@/lib/motion/gsap"

/** Rest width: the page-wide `--wdth` that :root sets in globals.css. */
export const LINK_WDTH_REST = 100
/**
 * §6.4 asks for a +20 lean. Martian Mono's width axis ends at 112.5, so the
 * mono links lean to the axis maximum; a target of 120 would be clamped by
 * the font mid-tween and the motion would read as finishing early.
 */
export const LINK_WDTH_HOVER = 112

/** Mono section link: Mist on Palm, Palm-muted on Limestone; Frond underline that becomes the text colour on hover. */
export const monoLinkClass =
  "type-mono inline-block text-center text-muted-foreground underline decoration-(--line) transition-[color,text-decoration-color] duration-200 ease-(--ease-studio) contain-layout hover:decoration-current"

const HOVER_DURATION = 0.2

/**
 * Click handler for `<a href="#section">`. Leaves modified clicks and
 * non-primary buttons to the browser (new tab, etc.).
 */
export function useAnchorScroll() {
  const { scrollTo } = useLenis()

  return React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const href = event.currentTarget.getAttribute("href")
      if (!href || !href.startsWith("#") || href.length < 2) return
      event.preventDefault()
      scrollTo(href)
    },
    [scrollTo]
  )
}

/**
 * Binds the hover lean to every `[data-lean]` link inside `scope`.
 * Width is reserved once fonts are in (write all → read all → write all,
 * two layouts total) and again whenever a face finishes loading later.
 */
export function useLeanLinks(
  scope: React.RefObject<HTMLElement | null>,
  selector = "[data-lean]"
) {
  useGSAP(
    (_, contextSafe) => {
      const root = scope.current
      if (!root || !contextSafe) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { fine, reduce } = ctx.conditions as Record<string, boolean>
          if (!fine || reduce) return

          const links = gsap.utils.toArray<HTMLElement>(selector, root)
          if (links.length === 0) return

          let cancelled = false
          const reserve = () => {
            if (cancelled) return
            for (const el of links)
              el.style.setProperty("--wdth", String(LINK_WDTH_HOVER))
            const widths = links.map((el) => el.getBoundingClientRect().width)
            links.forEach((el, i) => {
              // A link hidden at this breakpoint measures 0; leave it alone.
              if (widths[i] > 0)
                el.style.minInlineSize = `${Math.ceil(widths[i])}px`
              el.style.setProperty("--wdth", String(LINK_WDTH_REST))
            })
          }
          const fonts = document.fonts
          fonts.ready.then(reserve)
          fonts.addEventListener("loadingdone", reserve)

          // Links that were display:none (the nav below 1024px) need measuring
          // once they appear; the scope's box changes with the viewport.
          let timer = 0
          const schedule = () => {
            window.clearTimeout(timer)
            timer = window.setTimeout(reserve, 150)
          }
          const observer = new ResizeObserver(schedule)
          observer.observe(root)

          const lean = contextSafe((el: HTMLElement, wdth: number) => {
            gsap.to(el, {
              "--wdth": wdth,
              duration: HOVER_DURATION,
              ease: "studio",
              overwrite: "auto",
            })
          })
          const onEnter = (event: PointerEvent) => {
            if (event.pointerType === "touch") return
            lean(event.currentTarget as HTMLElement, LINK_WDTH_HOVER)
          }
          const onLeave = (event: PointerEvent) => {
            if (event.pointerType === "touch") return
            lean(event.currentTarget as HTMLElement, LINK_WDTH_REST)
          }
          for (const el of links) {
            el.addEventListener("pointerenter", onEnter)
            el.addEventListener("pointerleave", onLeave)
          }

          return () => {
            cancelled = true
            observer.disconnect()
            window.clearTimeout(timer)
            fonts.removeEventListener("loadingdone", reserve)
            for (const el of links) {
              el.removeEventListener("pointerenter", onEnter)
              el.removeEventListener("pointerleave", onLeave)
              el.style.removeProperty("--wdth")
              el.style.removeProperty("min-inline-size")
            }
          }
        }
      )
    },
    { scope }
  )
}
