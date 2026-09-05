"use client"

import * as React from "react"

import { useLenis } from "@/components/providers/smooth-scroll"
import { Wordmark } from "@/components/sections/primitives"
import { Button } from "@/components/ui/button"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap"
import { site } from "@/lib/site.config"

import { monoLinkClass, useAnchorScroll, useLeanLinks } from "./link-motion"

/** Mirrors `--nav-h` in globals.css; ScrollTrigger positions need a number. */
const NAV_H = 56
/** Scroll travel in a new direction before the bar reacts (px). */
const DIRECTION_THRESHOLD = 12
/** §6.1: the nav is the last beat of the load sequence. */
const FADE_IN_AT = 1.8
const FADE_IN_DURATION = 0.3
/** §5.1: hide/show in 240ms, studioInOut. */
const HIDE_DURATION = 0.24

/** Work / Capabilities / Team / Riyadh. Contact is the CTA. */
const sectionLinks = site.nav.filter((item) => item.href !== "#contact")

/**
 * The frame (DESIGN.md §5.1). Fixed, 56px, transparent over the current
 * ground: the bar carries its own `data-ground`, which a sentinel
 * ScrollTrigger per Limestone section flips so text and CTA invert
 * through the tokens. No language toggle, no hamburger; on phones the
 * section links live in the footer.
 */
export function Nav() {
  const ref = React.useRef<HTMLElement>(null)
  const { scrollTo } = useLenis()
  const onAnchorClick = useAnchorScroll()
  useLeanLinks(ref)

  useGSAP(
    () => {
      const nav = ref.current
      if (!nav) return
      ;(window as unknown as { __ST: unknown }).__ST = ScrollTrigger

      // Ground inversion, always on. A Set survives adjacent Limestone
      // sections toggling in either order.
      const active = new Set<Element>()
      // Scope must be the document: useGSAP({ scope }) makes a bare
      // toArray() search inside <header>, which never contains a section.
      const limestone = gsap.utils.toArray<HTMLElement>(
        'section[data-ground="sand"]',
        document
      )
      for (const section of limestone) {
        ScrollTrigger.create({
          trigger: section,
          start: `top ${NAV_H}px`,
          end: `bottom ${NAV_H}px`,
          // Created before the page's pins; refresh after them so their
          // pin spacing is in the DOM when this trigger measures.
          refreshPriority: -1,
          onKill: () => console.log("[nav-debug] sentinel killed", section.id),
          onToggle: (self) => {
            if (self.isActive) active.add(section)
            else active.delete(section)
            nav.dataset.ground = active.size > 0 ? "sand" : "night"
          },
        })
      }

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
          // Always matches, so the bar still appears where neither pointer
          // query does (pointer: none).
          any: "all",
        },
        (ctx) => {
          const { reduce } = ctx.conditions as Record<string, boolean>

          if (reduce) {
            gsap.set(nav, { opacity: 1, yPercent: 0 })
            return
          }

          const fade = gsap.to(nav, {
            opacity: 1,
            duration: FADE_IN_DURATION,
            delay: FADE_IN_AT,
            ease: "studio",
          })

          // Hide on scroll down, return on scroll up. Never while the page is
          // at the top or a form field has focus.
          const yTo = gsap.quickTo(nav, "yPercent", {
            duration: HIDE_DURATION,
            ease: "studioInOut",
          })
          let hidden = false
          let lastDirection = 0
          let anchorY = 0

          const show = () => {
            if (!hidden) return
            hidden = false
            yTo(0)
          }
          const hide = () => {
            if (hidden) return
            hidden = true
            yTo(-100)
          }

          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
              const y = self.scroll()
              if (self.direction !== lastDirection) {
                lastDirection = self.direction
                anchorY = y
              }
              if (y <= NAV_H) {
                show()
                return
              }
              if (self.direction === 1) {
                if (
                  y - anchorY > DIRECTION_THRESHOLD &&
                  !document.activeElement?.closest("form")
                )
                  hide()
              } else if (
                self.direction === -1 &&
                anchorY - y > DIRECTION_THRESHOLD
              ) {
                show()
              }
            },
          })

          // A control inside the bar must never take keyboard focus while
          // hidden or still fading in.
          const onFocusIn = () => {
            fade.progress(1)
            show()
          }
          nav.addEventListener("focusin", onFocusIn)
          return () => nav.removeEventListener("focusin", onFocusIn)
        }
      )
    },
    { scope: ref }
  )

  return (
    <header
      ref={ref}
      data-ground="night"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-(--nav-h) gutter text-foreground transition-colors duration-[160ms] ease-(--ease-studio) will-change-transform motion-safe:opacity-0"
    >
      <div className="flex h-full items-center gap-8 lg:gap-12">
        <a
          href="#hero"
          onClick={onAnchorClick}
          className="pointer-events-auto inline-block"
        >
          <Wordmark />
        </a>

        <nav
          aria-label="Primary"
          className="pointer-events-auto hidden lg:block"
        >
          <ul className="flex items-center gap-6">
            {sectionLinks.map((item) => (
              <li key={item.href} className="flex">
                <a
                  href={item.href}
                  onClick={onAnchorClick}
                  data-lean
                  className={monoLinkClass}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Button
          variant="sun"
          size="sm"
          className="pointer-events-auto ms-auto"
          onClick={() => scrollTo("#contact")}
        >
          <span className="md:hidden">{site.contact.ctaShort}</span>
          <span className="hidden md:inline">{site.contact.cta}</span>
        </Button>
      </div>
    </header>
  )
}
