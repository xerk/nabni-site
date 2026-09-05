"use client"

/**
 * Single place where GSAP plugins are registered.
 * Every client component that animates must import gsap from here so that
 * plugin registration is guaranteed to run before use.
 */
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"
import { CustomEase } from "gsap/CustomEase"
import { useGSAP } from "@gsap/react"

if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    DrawSVGPlugin,
    CustomEase,
    useGSAP
  )

  // On-screen keyboards resize the viewport on phones; never refresh pins for that.
  ScrollTrigger.config({ ignoreMobileResize: true })

  // Display fonts swap in after first paint and change layout heights.
  if (typeof document !== "undefined" && "fonts" in document) {
    document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
  }

  // Named eases shared by every section (mirrored as CSS --ease-* tokens).
  const eases: Record<string, string> = {
    studio: "M0,0 C0.16,1 0.3,1 1,1", // reveals
    studioInOut: "M0,0 C0.65,0 0.35,1 1,1", // nav hide/show, accordion
    carve: "M0,0 C0.7,0 0.3,1 1,1", // relief morphs (≈ power3.inOut)
    lift: "M0,0 C0.25,1 0.5,1 1,1", // headline rises (≈ power4.out)
  }
  for (const [name, path] of Object.entries(eases)) {
    if (!CustomEase.get(name)) CustomEase.create(name, path)
  }
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, useGSAP }
