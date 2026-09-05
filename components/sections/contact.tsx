"use client"

/**
 * CONTACT — Book a build call. DESIGN.md §5.7 (inversion 2: Limestone).
 *
 * The form posts to app/actions/contact.ts through React 19 `useActionState`.
 * The stone returns beside the form under first light, carrying the carved
 * brief, and the same brief pre-fills the first field. Typing here never
 * re-carves: this surface is the form; the stone shows what was carved.
 */

import * as React from "react"
import { toast } from "sonner"

import { submitContact, type ContactState } from "@/app/actions/contact"
import { Section } from "@/components/sections/primitives"
import {
  maskedLines,
  revealFrom,
  watchLayout,
} from "@/components/sections/reveal"
import { SteleAnchor, SteleReadout } from "@/components/stele/stele"
import {
  stele,
  STELE_DEFAULT_WORD,
  STELE_DEPTH,
  STELE_LIGHT,
} from "@/components/stele/stele-state"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap"
import { site } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/* ---- copy: DESIGN.md §5.7. The spec's copy is the copy. ---- */
const copy = {
  heading: "Book a build call",
  project: "What do you want to build?",
  name: "Name",
  company: "Organisation",
  email: "Work email",
  submit: "Book a build call",
  orEmail: "or email",
  success: "Request sent. We reply within one working day with times.",
} as const

type FieldName = "project" | "name" | "company" | "email"

/** Reading order; also the order in which the first invalid field gets focus. */
const FIELD_ORDER: readonly FieldName[] = [
  "project",
  "name",
  "company",
  "email",
]

const INITIAL_STATE: ContactState = { status: "idle" }

/**
 * The toast fires from a Toaster mounted outside any ground (app/layout.tsx),
 * so it would paint Palm. §5.7 asks for the toast on Limestone: sonner puts
 * this className on the toast element that reads these variables. Tokens only.
 */
const TOAST_ON_LIMESTONE =
  "[--normal-bg:var(--color-sand)] [--normal-text:var(--color-night)] [--normal-border:var(--color-ash)]"

/* Brief prefill: the server snapshot is null, so hydration never reads storage. */
const readBrief = () => stele.getBrief()
const readNoBrief = () => null

/**
 * Focus underline: draws from the inline-start edge over 200ms on focus-within
 * (the global reduced-motion rule makes the transition instant).
 */
const UNDERLINE =
  "relative after:pointer-events-none after:absolute after:start-0 after:end-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-(--ease-studio) focus-within:after:scale-x-100 rtl:after:origin-right"

/** 10px Flag cell: the error marker. Sits on the first line of type-small. */
function ErrorCell() {
  return (
    <span
      aria-hidden="true"
      className="mt-1 size-2.5 shrink-0 rounded-cell bg-ember"
    />
  )
}

type ControlA11y = {
  id: string
  "aria-invalid": true | undefined
  "aria-describedby": string | undefined
}

function ContactField({
  name,
  label,
  error,
  children,
}: {
  name: FieldName
  label: string
  error?: string
  children: (a11y: ControlA11y) => React.ReactNode
}) {
  const id = `contact-${name}`
  const errorId = `${id}-error`
  const invalid = Boolean(error)

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>
        <span className="type-small text-muted-foreground transition-colors duration-200 ease-(--ease-studio) group-focus-within/field:text-foreground group-data-[invalid=true]/field:text-foreground">
          {label}
        </span>
      </FieldLabel>
      <div className={UNDERLINE}>
        {children({
          id,
          "aria-invalid": invalid || undefined,
          "aria-describedby": invalid ? errorId : undefined,
        })}
      </div>
      {error ? (
        <FieldError id={errorId}>
          <span className="flex items-start gap-2 type-small text-foreground">
            <ErrorCell />
            {error}
          </span>
        </FieldError>
      ) : null}
    </Field>
  )
}

export function Contact() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const submitRef = React.useRef<HTMLButtonElement>(null)
  /** Written inside gsap.matchMedia; read only in event handlers. */
  const motion = React.useRef({ width: false })

  const [state, formAction, pending] = React.useActionState(
    submitContact,
    INITIAL_STATE
  )
  const [, startTransition] = React.useTransition()

  const brief = React.useSyncExternalStore(
    stele.subscribe,
    readBrief,
    readNoBrief
  )
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined

  /**
   * Dispatch the action from a transition rather than through the form's
   * native action flow: React resets uncontrolled fields when a form action
   * settles, which would wipe the visitor's text under a validation error.
   * `action={formAction}` stays on the form for the no-JS path.
   */
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => {
      formAction(data)
    })
  }

  /* Result side effects: the toast on success, focus on the first invalid field. */
  React.useEffect(() => {
    if (state.status === "success") {
      toast(copy.success, { className: TOAST_ON_LIMESTONE })
      return
    }
    if (state.status !== "error" || !state.fieldErrors) return
    const errors = state.fieldErrors
    const first = FIELD_ORDER.find((key) => errors[key])
    if (!first) return
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }, [state])

  const focusOnMount = React.useCallback(
    (node: HTMLParagraphElement | null) => {
      node?.focus({ preventScroll: true })
    },
    []
  )

  useGSAP(
    () => {
      const section = sectionRef.current
      const heading = headingRef.current
      if (!section || !heading) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { fine, reduce } = ctx.conditions as Record<string, boolean>
          motion.current.width = !reduce

          /* Reveals: masked lines on the heading, an 8px rise on the rest. */
          if (!reduce) {
            maskedLines(heading, { trigger: heading })

            const reveals = gsap.utils.toArray<HTMLElement>(
              "[data-reveal]",
              section
            )
            if (reveals.length) {
              revealFrom(
                reveals,
                { y: 8, opacity: 0, stagger: 0.06 },
                { trigger: section, start: "top 80%" }
              )
            }
          }

          /* Stone re-entry: the fixed canvas exists only on fine pointers. */
          if (fine) {
            const light = STELE_LIGHT.contact

            const enter = () => {
              stele.setActive(true)
              stele.setAnchor("contact")
              stele.setLight({
                az: light.az,
                el: light.el,
                mode: "fixed",
                immediate: reduce,
              })
              stele.set({ depth: STELE_DEPTH.rest })
              // The stone carries the brief (or نبني) — never a capability word.
              const word = stele.getBrief() ?? STELE_DEFAULT_WORD
              if (stele.state.word !== word)
                stele.carve(word, { instant: true })
              if (reduce) {
                stele.set({ opacity: 1 })
                return
              }
              gsap.to(stele.state, {
                opacity: 1,
                duration: 0.4,
                overwrite: "auto",
                onUpdate: stele.invalidate,
              })
            }

            const leaveBack = () => {
              if (reduce) {
                stele.set({ opacity: 0 })
                stele.setActive(false)
                return
              }
              gsap.to(stele.state, {
                opacity: 0,
                duration: 0.3,
                overwrite: "auto",
                onUpdate: stele.invalidate,
                onComplete: () => stele.setActive(false),
              })
            }

            ScrollTrigger.create({
              trigger: section,
              start: "top 80%",
              onEnter: enter,
              onLeaveBack: leaveBack,
            })
          }

          return () => {
            // Tweens started inside ScrollTrigger callbacks are not context-owned.
            gsap.killTweensOf(stele.state, "opacity")
          }
        }
      )

      return watchLayout()
    },
    { scope: sectionRef }
  )

  /* Button press: label wdth 100 → 70 → 100 over 240ms, like a stamp. */
  const onPress = () => {
    const el = submitRef.current
    if (!el || !motion.current.width) return
    gsap.fromTo(
      el,
      { "--wdth": 100 },
      {
        "--wdth": 70,
        duration: 0.12,
        ease: "studioInOut",
        yoyo: true,
        repeat: 1,
        overwrite: "auto",
      }
    )
  }

  const mailto = `mailto:${site.contact.email}`

  return (
    <Section
      ref={sectionRef}
      id="contact"
      ground="sand"
      className="gutter section-pad"
      aria-labelledby="contact-heading"
    >
      <div className="flex flex-col gap-y-10 md:pointer-fine:grid-12 md:pointer-fine:grid-rows-[auto_1fr] md:pointer-fine:gap-y-0">
        {/* cols 1–6: heading and form (after the stone on <768 / coarse) */}
        <div className="order-2 md:pointer-fine:order-none md:pointer-fine:col-start-1 md:pointer-fine:col-end-7 md:pointer-fine:row-start-1 md:pointer-fine:row-end-3">
          <h2
            id="contact-heading"
            ref={headingRef}
            className="type-display contain-layout"
          >
            {copy.heading}
          </h2>

          <div data-reveal className="mt-10 md:pointer-fine:mt-12">
            {state.status === "success" ? (
              <p
                ref={focusOnMount}
                tabIndex={-1}
                role="status"
                className="measure type-h3"
              >
                {copy.success}
              </p>
            ) : (
              <form
                ref={formRef}
                action={formAction}
                onSubmit={onSubmit}
                noValidate
                aria-busy={pending || undefined}
                className="relative measure"
              >
                <FieldGroup className="gap-6">
                  <ContactField
                    name="project"
                    label={copy.project}
                    error={fieldErrors?.project}
                  >
                    {(a11y) => (
                      <Textarea
                        {...a11y}
                        key={brief ? `brief:${brief}` : "blank"}
                        name="project"
                        defaultValue={brief ?? ""}
                        rows={2}
                        required
                        autoComplete="off"
                      />
                    )}
                  </ContactField>

                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <ContactField
                      name="name"
                      label={copy.name}
                      error={fieldErrors?.name}
                    >
                      {(a11y) => (
                        <Input
                          {...a11y}
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          className="block"
                        />
                      )}
                    </ContactField>
                    <ContactField
                      name="company"
                      label={copy.company}
                      error={fieldErrors?.company}
                    >
                      {(a11y) => (
                        <Input
                          {...a11y}
                          name="company"
                          type="text"
                          autoComplete="organization"
                          className="block"
                        />
                      )}
                    </ContactField>
                  </div>

                  <ContactField
                    name="email"
                    label={copy.email}
                    error={fieldErrors?.email}
                  >
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        className="block"
                      />
                    )}
                  </ContactField>
                </FieldGroup>

                {/* Honeypot: off-screen, out of the tab order and the accessibility tree. */}
                <div
                  aria-hidden="true"
                  className="absolute -start-[9999px] top-0 size-px overflow-hidden"
                >
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button
                    ref={submitRef}
                    type="submit"
                    variant="default"
                    disabled={pending}
                    onClick={onPress}
                    className="gap-2.5 ps-7 pe-2 disabled:opacity-100"
                  >
                    {copy.submit}
                    {/* Reserved space: the cell fades in beside the label without a width change. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 rounded-cell bg-current",
                        pending ? "animate-pulse" : "opacity-0"
                      )}
                    />
                  </Button>
                  <p className="type-small text-muted-foreground">
                    {copy.orEmail}{" "}
                    <a
                      href={mailto}
                      className="underline decoration-(--line) transition-[color,text-decoration-color] duration-200 ease-(--ease-studio) hover:text-foreground hover:decoration-current"
                    >
                      {site.contact.email}
                    </a>
                  </p>
                </div>

                <div aria-live="polite">
                  {state.status === "error" ? (
                    <p className="mt-4 flex items-start gap-2 type-small text-foreground">
                      <ErrorCell />
                      {state.message}
                    </p>
                  ) : null}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* cols 8–12: the stone under first light, then its readout */}
        <div className="order-1 md:pointer-fine:order-none md:pointer-fine:col-start-8 md:pointer-fine:col-end-13 md:pointer-fine:row-start-1">
          <div data-cursor="stone" className="md:pointer-fine:max-w-[28vw]">
            <SteleAnchor
              name="contact"
              className="h-[40svh] w-full md:pointer-fine:aspect-[2/3] md:pointer-fine:h-auto"
            />
          </div>
          <SteleReadout className="mt-3" />
        </div>

        {/* Sidebar: base facts. Under the readout on desktop, under the form on mobile. */}
        <address
          data-reveal
          className="order-3 flex flex-col items-start gap-1 type-mono text-muted-foreground not-italic [--wdth:90] md:pointer-fine:order-none md:pointer-fine:col-start-8 md:pointer-fine:col-end-13 md:pointer-fine:row-start-2 md:pointer-fine:mt-8 md:pointer-fine:self-start"
        >
          <p>{site.location.line}</p>
          <a
            href={mailto}
            className="underline decoration-(--line) transition-[color,text-decoration-color,font-variation-settings] duration-200 ease-(--ease-studio) wdth-axis hover:text-foreground hover:decoration-current hover:[--wdth:105]"
          >
            {site.contact.email}
          </a>
        </address>
      </div>
    </Section>
  )
}
