# Nabni — studio site

A one-page showcase for a Saudi engineering studio whose pitch is "bring us the hard one": web, mobile, desktop, APIs and AI engineering, built in Riyadh.

The design is documented in [`DESIGN.md`](./DESIGN.md). Read §0 (implementation decisions) before changing anything visual; every colour, type role and motion rule on the page derives from that file.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (`base-nova` preset on Base UI, RTL flag on)
- three.js via React Three Fiber + drei — the glass word (`components/glass/`), mounted by `components/stele/`
- GSAP 3.15 with ScrollTrigger, SplitText, DrawSVG, CustomEase; Lenis smooth scroll
- Fonts via `next/font/google`: Anybody (width axis), Reem Kufi, IBM Plex Sans Arabic, Martian Mono

## Run

Node 24 and pnpm are required.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
pnpm typecheck
pnpm lint
```

Copy `.env.example` to `.env.local` to configure the contact form (Resend), the booking link and the public URL. Without `RESEND_API_KEY` the form logs submissions in development and shows a "not connected" message in production.

## Where things live

| Path | What |
|---|---|
| `lib/site.config.ts` | Brand name, URL, email, nav. Change the name here only. |
| `content/*.ts` | Capabilities, project types, process, team roles, stack manifest, Riyadh mapping. Plain data, no markup. |
| `components/sections/*` | One file per section in page order: nav, hero, capabilities, work, team, kingdom, contact, footer. |
| `components/glass/*` | The glass word: scene, engine, SSR outline placeholder. |
| `components/stele/*` | Mounting, scroll zones, placement and the command API (`stele-state.ts`) the sections call. |
| `lib/glass/*` | Text → shaped glyph outlines (`shape.ts`), path parsing (`path.ts`), extrusion (`geometry.ts`), pre-shaped words (`word-paths.ts`). |
| `public/fonts/*` | Reem Kufi and Anybody variable TTFs (Open Font Licence, see `LICENSE.md`), used to shape glyph outlines. Regenerate the committed words after a font change: `node scripts/shape-words.mjs`. |
| `app/actions/contact.ts` | Contact form server action (zod validation, Resend delivery, honeypot). |
| `app/globals.css` | Design tokens, grounds, type utilities, cursor styles. |
| `scripts/screenshots.mjs` | Visual QA: `node scripts/screenshots.mjs http://localhost:3000 out-dir` (desktop, mobile, reduced motion, hero scroll). |

## Before launch

These are deliberate placeholders or unconfirmed claims. See `DESIGN.md` §0 and §9.

1. Brand name: `site.name` defaults to "Nabni".
2. Portfolio entries in `content/projects.ts` describe project types drawn from real work but are drafts; replace with real case studies. No client names or logos are used anywhere.
3. Claims to confirm in copy: "You own the code, the infra and the docs from day one", "We reply within one working day with times", "they stay on for the run".
4. Arabic locale: only verified accents are rendered (نبني, الرياض). The `EN | عربي` toggle and `/ar` route are not built; layout uses logical properties so RTL can be added.
5. Hero input ("Carve it"): user-test with three target buyers at 390px and 1440px; the fallback is in `DESIGN.md` §9.
6. Social links in `lib/site.config.ts` are placeholders.
