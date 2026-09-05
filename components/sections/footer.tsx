"use client"

import * as React from "react"

import { Wordmark } from "@/components/sections/primitives"
import { site } from "@/lib/site.config"

import { monoLinkClass, useAnchorScroll, useLeanLinks } from "./link-motion"

/** Evaluated once per bundle instance; render stays pure for the compiler. */
const YEAR = new Date().getFullYear()

/**
 * The footer (DESIGN.md §5.8). Palm ground, one row on desktop, three rows
 * below 768px: wordmark · section links · place, email, ©. Hover only.
 * No language toggle (§0.2).
 */
export function Footer() {
  const ref = React.useRef<HTMLElement>(null)
  const onAnchorClick = useAnchorScroll()
  useLeanLinks(ref)

  return (
    <footer
      ref={ref}
      data-ground="night"
      className="bg-background gutter pt-8 pb-10 text-foreground"
    >
      <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-center md:gap-x-10 md:gap-y-4">
        <a
          href="#hero"
          onClick={onAnchorClick}
          className="inline-block self-start md:self-center"
        >
          <Wordmark />
        </a>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {site.nav.map((item) => (
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

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 type-mono text-muted-foreground md:ms-auto">
          <span>
            {site.location.city}, {site.location.country}
          </span>
          <a
            href={`mailto:${site.contact.email}`}
            data-lean
            className={monoLinkClass}
          >
            {site.contact.email}
          </a>
          <span>
            © {YEAR} {site.name}
          </span>
        </div>
      </div>
    </footer>
  )
}
