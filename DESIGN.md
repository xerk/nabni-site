# DESIGN.md — Nabni site

This file is the single source of truth for every visual and motion decision.
§V2 records the client's redirection after the first build; §0 records
implementation decisions on top of the design panel's spec; everything after
§0 is that spec, verbatim (its green palette and "Excelerator" name are
superseded by §V2).

## V2 — "Nabni, night edition" (client redirection, 2026-09-05)

Client feedback on v1: "I like the idea, but why green, and why this name.
The design should be smoother, with more GSAP and three.js; download 3D models;
we need something inspiring." Decisions taken with the client:

**Brand**: **Nabni** / **نبني** ("we build"). `site.name` + `site.nameAr`. The
wordmark sets both scripts on one baseline (Anybody 700 wdth 110 + Reem Kufi).
The stone's load word نبني is now the logo reveal.

**Palette (replaces §2.1 colours; token names changed everywhere)**

| Token | Hex | Role |
|---|---|---|
| night | #0F0D0B | main ground: warm obsidian, a desert night |
| sand | #EFE7D9 | foreground on Night; ground of the two inverted sections (work, contact) |
| dune | #A89D8B | secondary text on Night (7.4:1); UI edges on Night |
| amber | #F0A43A | the sun: key light on the stone, cursor, focus ring on Night, primary CTA hover fill. Never text on Sand |
| ember | #8F4E0E | amber pulled down for Sand grounds: links, focus ring, filled weave cells (5.3:1 on Sand) |
| ash | #4A4238 | lines on Night only, never text |
| dust | #B9AE9B | lines on Sand only, never text |
| basalt | #26211C | 3D slab material; SVG placeholder ground |
| pitch | #070605 | 3D hemisphere ground; SVG side faces |
| night-muted | #5C5346 | secondary text on Sand (5.9:1) |
| row-tint | #E3D9C6 | portfolio row hover on Sand |

Grounds: `data-ground="night"` (default) and `data-ground="sand"` (work,
contact). Amber keeps a three-role cap in the DOM (cursor, focus on Night, CTA
hover); in WebGL it is the key light. Raised stone cells tint toward Sand.

**Type**: unchanged (§3).

**3D, in addition to the Stele** (all procedural unless stated; ≤2 WebGL
contexts on desktop, 1 at a time on mobile; every canvas pauses offscreen):

1. *Atmosphere* — a sparse amber dust field (≈1,500 points, additive, slow
   drift, pointer parallax) rendered in the same stage canvas behind the slab
   on fine pointers. Off under reduced motion and on coarse pointers.
2. *Sculpture* — one chrome-and-glass monolith in the team section ("one
   team"): a smooth procedural form (superellipsoid / twisted prism) with a
   metallic material lit by amber and sand lightformers (drei `Environment`
   built from lightformers, no HDR download), rotating with scroll, tilting
   toward the pointer. Reduced motion: static.
3. *Devices* — CC0 phone and laptop models (downloaded, licence recorded in
   `public/models/LICENSES.md`; procedural rounded-box devices as fallback)
   in the work section: a sticky canvas on desktop shows the device for the
   hovered/expanded row with a procedural screen (project title in display
   type + a generated UI pattern in the palette); scroll turns the device.
   Mobile: a small in-flow device above the expanded row's details.

**Motion upgrades (GSAP)**: intro "sunrise" (amber key light rises over the
stone while the bilingual wordmark and H1 reveal), magnetic primary buttons
(pointer proximity ≤ 80px, 0.35 strength), ground wipes (a clip-path wipe
scrubbed over the last 20vh before each Sand section instead of a hard edge),
heading parallax (yPercent −8 scrubbed), work rows with an amber underline
sweep on hover, device rotation bound to scroll, smoother Lenis (lerp 0.075).
Everything obeys §6.5 under reduced motion.

**Performance budget**: unchanged (§4.9) plus: dust ≤ 1 ms GPU/frame, devices
≤ 1.5 MB of models total, sculpture ≤ 40k triangles, no post-processing.

## V3 — The Glass Word (hero centrepiece, client redirection later on 2026-09-05)

Client feedback on the v2 stone: "the right one, the 3D, is not good; use elements
from the internet, something inspiring." Chosen replacement: **the brand word
as a refractive glass sculpture**. The interaction idea survives intact — the
word the visitor types is cast in glass — only the object changes.

**What it is.** نبني set in Reem Kufi 700 (and Latin words in Anybody 900 wdth
150) extruded into thick, bevelled glass: refraction, dispersion, an amber sun
bending through it, dust motes around it, floating with a slow weighted drift
and tilting toward the pointer. On load the glyphs assemble from a scattered
cloud into the word (1.1 s, "carve" ease, per-glyph stagger). When the word
changes (scroll → WE BUILD, capability words, the visitor's brief) the old
glyphs dissolve (scale + opacity, 0.35 s) while the new ones assemble (0.7 s).
At the end of capabilities the glass dims to a silhouette; at contact it
returns carrying the brief.

**Pipeline.** Real glyph outlines with correct Arabic joining via opentype.js
(`public/fonts/reem-kufi-700.ttf`, `public/fonts/anybody-900-wdth150.ttf`,
OFL, fetched by `scripts/fetch-fonts.mjs`): text → shaped path → SVG path data
→ three `SVGLoader` shapes → `ExtrudeGeometry` (depth ≈ 0.28 of cap height,
bevel 3 segments, curveSegments 10). Runtime-capable for any brief (≤ 40 chars,
≤ 3 lines, cached per string). Committed outlines for نبني, WE BUILD and the
five capability words in `lib/glass/word-paths.ts` feed the SSR placeholder
(the word's outline in dune with a hairline amber stroke) and the first frame.

**Material.** drei `MeshTransmissionMaterial` on fine pointers (ior 1.45,
thickness ≈ 0.6, roughness 0.08, chromaticAberration 0.04, anisotropy 0.1,
resolution 512, samples 6); on coarse pointers or after the frame-time
watchdog demotes, a cheap glass: `MeshPhysicalMaterial` clearcoat 1, roughness
0.06, transmission 0, opacity 0.86, envMap from the same lightformer
environment. Environment: drei `Environment` from Lightformers (sand top
strip, amber side, dune fill), no HDR download. One amber key light, one dune
fill. No post-processing.

**API continuity.** `components/stele/stele-state.ts` commands are unchanged:
`carve(text)` now casts glass; `finishCarve`, anchors, zones, `anchorOverride`,
light targets and the readout all keep working. The readout line becomes
`{word} · {glyphs} glyphs · {triangles} tris · light {az}° {el}°`. The hero
button reads **Cast it**; the sr-only sentence becomes "A glass sculpture of
the word 'we build' in Arabic; it re-casts to whatever you type above."

**Budget.** Transmission pass at 512 px, ≤ 60k triangles per word, canvas dpr
≤ 1.5, demand frameloop when idle (the drift keeps a low-rate loop only while
in view). Reduced motion: static word, no drift, instant casts.

---

## 0. Implementation decisions (read first)

1. **Brand name** is `site.name` in `lib/site.config.ts` ("Excelerator", replaceable in one line). Nothing is built on its letterforms.
2. **Arabic (AR) mode is not built in this pass.** No `EN | عربي` toggle is rendered; `NEXT_PUBLIC_ENABLE_AR` is reserved. Arabic appears only as verified accents: نبني on the stone and in the readout, الرياض in the kingdom line, and whatever Arabic a visitor types (shaped by the browser). All layout uses logical properties so an `/ar` locale can be added later.
3. **The hero input ("Carve it") is built as specified.** The user-test gate in §9.1 cannot be run here; the fallback is documented there.
4. **Stele placement**: fine pointers get ONE fixed full-viewport canvas whose slab is placed on DOM anchor rects (`#stele-anchor-hero`, `#stele-anchor-capabilities`, `#stele-anchor-contact`), measured by the stele module itself inside the Lenis scroll callback. Sections only render the anchors and call the `stele` API (`components/stele/stele-state.ts`). Coarse pointers get in-flow canvases in the hero and contact blocks.
5. **Committed bitmaps** (`lib/stele/bitmaps.ts`) are produced with Playwright against the dev page, using the real next/font families.
6. **Claims trimmed to what can be stated safely**: "No subcontracting" is dropped; "in-house engineers in Riyadh" stays. The commerce row does not claim ZATCA delivery; ZATCA appears in the kingdom need→ship mapping as an offering. "You own the code, the infra and the docs from day one" and "We reply within one working day" are kept and flagged for confirmation in the handover notes.
7. **Team headcounts and `teamFacts.founded` are not rendered.**
8. **Fonts**: Anybody (wdth axis), Reem Kufi, IBM Plex Sans Arabic (400/500/600), Martian Mono (wdth axis), all via `next/font/google`. Canvas rasterisation must use `font.style.fontFamily`.
9. **Every section root** carries `id` and `data-ground="palm" | "limestone"`; shadcn semantic tokens are remapped per ground in `globals.css`. No component sets colours directly; use `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, or the named palette utilities (`text-mist`, `bg-limestone`, ...).
10. **Type roles** are CSS utilities in `globals.css`: `type-display-xl`, `type-display`, `type-h2`, `type-h3`, `type-body`, `type-small`, `type-mono`, plus `font-wdth` (reads `--wdth`). Never `transform: scaleX` on text.
11. **Relief as built (supersedes §4.3/§4.4 details).** Headless rendering showed the spec's 6% lattice gap aliasing into moiré at ~4px per cell, flat cells casting stripe shadows, and raised faces invisible except as 8-cell shadow smears. The built relief therefore has no gap (`fill 1.02`), flat cells are not drawn (the slab body shows through), geometric height is `state.depth × 0.4` (≈0.014 at rest, ≈0.005 at noon; the state constants are unchanged), raised faces are tinted toward Limestone via `instanceColor` in proportion to height × depth (so the word still dissolves at noon), drawn cells are bevelled boxes with a shader-side wall mask, and the shadow map is tightened (`bias −0.0005`, `normalBias 0.002`). Tier B keeps its fake one-cell shadow on top.
12. **Stone lifecycle is derived from geometry.** `components/stele/stele-zones.ts` computes the zone (hero → capabilities → none → contact) from section rects on every scroll, resize and refresh; section ScrollTrigger callbacks are hints only. The hero's pinned travel still uses `anchorOverride`.
13. **Hero pin is 150%** (not 200%) with no opacity fades on the hero content; the empty beat in the spec's 0.55–1.0 range read as broken.
14. **Reveals are jump-safe** via `components/sections/reveal/`: a shared trigger helper plays or finishes once-only reveals when a refresh finds the start already passed, and a body ResizeObserver refreshes ScrollTrigger when the document height changes.

---

# DESIGN SPEC — The Stele: carve your brief

Implementation-ready. Built against the scaffold at `/home/xerk/code/xerk/excelerator` (Next 16.2, React 19.2, three 0.185, R3F 9.7, drei 10.7, GSAP 3.15 with all plugins, Lenis 1.3, shadcn base-nova with `rtl: true`, Tailwind v4). Every file the spec touches is named in Appendix A.

---

## 0. Decision record

**Winner: The Stele — carve your brief.** Totals: Stele 120.5, Builder's Grid 112, Nameplate 106.5, Layl 105. Two of three judges picked it; the third (buildability lens) scored it 39.5 vs 41 and its objections are all fixable at spec level, which this document does. It wins on the three things that matter for this brief: the Saudi material is the mechanism (relief only reads under raking light; square Kufic is already a grid), the Arabic is correct by construction (font-shaped through the canvas, never hand-drawn, never scaled), and it is the lightest 3D on the panel (one InstancedMesh, plain MeshStandardMaterial, one shadow pass, demand frameloop).

**Grafts taken** (each serves the single idea "one stone accepts what you name"):

| From | What | Where it lands |
|---|---|---|
| Nameplate | Live readout of the object's own state instead of a preloader; "scrolling early completes the make, nothing is ever half-made" | §4.8 inscription readout; §6.1 load rule |
| Layl to Zahira | One source of truth for colour feeding both CSS and GLSL | §2.4 (CSS is the source; three.js reads computed properties at mount) |
| Builder's Grid | Server-rendered SVG placeholder that is both LCP and the no-WebGL path | §4.7 |
| Builder's Grid | "Base" facts (city, AST UTC+3, Sun–Thu) as one mono line | §5.7 contact sidebar |
| Nameplate | "You own the code, the infra and the docs" as a plain statement under the process | §5.5 |

**Grafts declined**: Nameplate's dark screen (the Stele has no dark surface; the ground is chromatic), star-name serials and star chart (encode nothing here), Kufam body (would push the whole page into the heritage register judge 2 warned about; Plex Sans Arabic keeps the body in engineering register), the girih clock, the sadu drawdown, Layl's sun-bound width axis (the Stele's width axis is bound to attention, not time).

**Judge critiques of the winner, and the resolution in this spec**:

| Critique | Resolution |
|---|---|
| Width lens is the hover-accordion services list in disguise (J1) | The stone stays on the page through capabilities and carves each capability word as it becomes active; the five words are real buttons (keyboard path); the ledger is tool names in mono. §5.3 |
| Hero input reads as a prompt bar (J1, J3) | Ruled line in display type, no box/icon/pill, "Carve it", result is stone; user-test gate with a defined fallback. §5.2, §9 |
| Green + monumental + stone = cultural-authority vocabulary (J2) | Sentence-case H1, a static mono tool line on screen one, the mono readout under the stone (it reads as an instrument being computed), tool names in every ledger. §5.2, §8 |
| 48×72 grid cannot carve a 40-char brief (J3) | Grid raised to 96×144 (Tier A) with 40-char / 3-line cap; 64×96 (Tier B) with 24-char / 2-line cap; cell math in §4.5 |
| Cursor-as-light is pointer:fine only; phone gets a static stone at 45% opacity behind text (J3) | On coarse pointers the light is bound to scroll (the sun rises as you scroll the hero) and to horizontal drag on the stone; the stone sits in its own block below the headline at full opacity; no text ever overlaps the canvas. §4.6, §5.2 |
| 220vh pin, text input inside a pin, keyboard resize (J3) | Pin only on `pointer: fine` (200vh); coarse pointers get an unpinned hero with time-based beats; `ScrollTrigger.config({ ignoreMobileResize: true })` globally. §6.2 |
| Stone leaves the page between hero and contact (J3) | Stone persists through capabilities (fine pointers); the hero's noon-dissolve beat moves to the end of capabilities so the sun never runs backwards. §4.6 |
| Full green fatigue (J2) | Two Limestone inversions (work, contact) are load-bearing and locked. §5 |

---

## 1. Direction

**Name**: The Stele — carve your brief.

**Thesis**: The claim "this team can build anything" is not stated on the page; it is tested. The site is one standing stone and giant type. The stone's face is a lattice of cells that rise in relief to spell a word: on load it reads نبني (nabni, "we build"); as you scroll it re-carves to WE BUILD; if you type your project into the hero it re-carves to your words, in Latin or properly shaped Arabic, and carries them down the page into the contact form. This is derived from Saudi material culture rather than borrowed from it: square Kufic is grid calligraphy (a cell is already a Kufic unit), and the Dadanite inscriptions at Al-Ula are words in rock that only read under a raking sun, so the 3D object is an inscription, not a scene, and the cursor is the sun that lights it. Typography carries everything else: Anybody's 50–150 width axis turns headline words from spires into slabs, and Reem Kufi's weight axis lets Arabic gain mass alongside it without distortion. The ground is palm-shade green pulled down from the flag's #006C35, a chromatic ground rather than a dark mode; emphasis is done by inversion (Limestone blocks with Palm type), never by an accent colour.

**The one aesthetic risk**: the first interaction on the page is a text input in the hero. If it reads as a chatbot prompt bar it undermines the whole thing. It is worth taking because it does the page's single job directly: the prospect names their thing and watches it accepted. It is disciplined by form (a Mist rule under a question, set in display type; no box, no icon, no pill, no "ask" or "AI" language), by the button ("Carve it", not "Send"), and by what comes back (stone, not a reply). Gate: three target-buyer tests at 390px and 1440px before build sign-off; the fallback (§9, risk 1) is defined and cheap.

---

## 2. Design tokens

### 2.1 Token block (`app/globals.css`, replaces the neutral shadcn palette)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme {
  /* ---- colour: six named colours, two 3D materials, three derived values ---- */
  --color-palm:      #0F452A; /* main ground: flag green in the shade of a date palm */
  --color-limestone: #EEEAE1; /* foreground on Palm; ground of the two inverted sections */
  --color-mist:      #A9BFB0; /* secondary text on Palm; every UI edge on Palm */
  --color-flag:      #006C35; /* literal flag green, used on Limestone only: links, focus, filled cells */
  --color-frond:     #3C8A5E; /* lines only, never text */
  --color-aldebaran: #E9A15A; /* the sun: cursor, focus ring on Palm, one hover fill. Never on Limestone */
  --color-slab:      #1B5A39; /* 3D material and SVG fallback ground only */
  --color-shade:     #0A2F1D; /* 3D hemisphere ground + SVG side faces only */

  --color-palm-muted: color-mix(in srgb, #0F452A 82%, #EEEAE1); /* #37634B: secondary text on Limestone, 5.74:1 */
  --color-row-tint:   color-mix(in srgb, #006C35 18%, #EEEAE1); /* #C3D3C2: portfolio row hover ground; Palm on it 7.04:1 */
  --color-halo:       color-mix(in srgb, #EEEAE1 12%, transparent); /* cursor halo over the stone */

  /* ---- type families (next/font variables set in app/layout.tsx) ---- */
  --font-display:    var(--font-anybody), "Arial Narrow", Impact, sans-serif;
  --font-display-ar: var(--font-reem-kufi), "Noto Kufi Arabic", "Segoe UI", sans-serif;
  --font-sans:       var(--font-plex-arabic), "Segoe UI", Tahoma, Arial, sans-serif;
  --font-mono:       var(--font-martian), ui-monospace, "SFMono-Regular", Menlo, monospace;
  --font-heading:    var(--font-display);

  /* ---- radii: the page is stone; nothing is rounded except the cell unit and rings ---- */
  --radius-none: 0px;
  --radius-cell: 2px;   /* weave-mark cells, cursor bar ends, cell markers */
  --radius-ring: 2px;   /* focus rings */

  /* ---- spacing: 8px base ---- */
  --space-0-5: 0.25rem;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-6: 3rem;
  --space-8: 4rem;
  --space-12: 6rem;
  --space-16: 8rem;
  --gutter: clamp(1.25rem, 4vw, 4rem);
  --section-pad: 18vh;            /* 12vh below 768px, see 2.3 */
  --measure: 38rem;               /* body copy max width */
  --nav-h: 56px;

  /* ---- easing ---- */
  --ease-studio:        cubic-bezier(0.16, 1, 0.3, 1);    /* reveals (matches CustomEase "studio") */
  --ease-studio-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* matches CustomEase "studioInOut" */
  --ease-carve:         cubic-bezier(0.7, 0, 0.3, 1);     /* relief morphs; GSAP: power3.inOut */
  --ease-lift:          cubic-bezier(0.25, 1, 0.5, 1);    /* headline rises; GSAP: power4.out */

  /* ---- durations ---- */
  --dur-micro:  160ms;   /* inversion swap, button press */
  --dur-fast:   200ms;   /* link width lean, ledger crossfade */
  --dur-base:   320ms;   /* accordion expand, nav hide/show (240ms) */
  --dur-reveal: 600ms;   /* masked line reveals, DrawSVG rules */
  --dur-carve:  1100ms;  /* hero re-carve */
  --dur-lens:   600ms;   /* capability re-carve */
}
```

### 2.2 shadcn semantic remap, scoped per ground

Every section root carries `data-ground="palm" | "limestone"`. shadcn Field, Input, Textarea, Button, Accordion, Sheet and sonner then inherit the right pair with no per-component overrides.

```css
:root, [data-ground="palm"] {
  --background: var(--color-palm);
  --foreground: var(--color-limestone);
  --card: var(--color-palm);              --card-foreground: var(--color-limestone);
  --popover: var(--color-palm);           --popover-foreground: var(--color-limestone);
  --primary: var(--color-limestone);      --primary-foreground: var(--color-palm);
  --secondary: transparent;               --secondary-foreground: var(--color-limestone);
  --muted: var(--color-palm);             --muted-foreground: var(--color-mist);
  --accent: var(--color-aldebaran);       --accent-foreground: var(--color-palm);
  --destructive: var(--color-limestone);  /* errors are sentences, not red */
  --border: var(--color-mist);
  --input: var(--color-mist);
  --ring: var(--color-aldebaran);
  --radius: 0px;
  color-scheme: dark; /* native form controls and scrollbars pick the light-on-dark set */
}
[data-ground="limestone"] {
  --background: var(--color-limestone);
  --foreground: var(--color-palm);
  --card: var(--color-limestone);         --card-foreground: var(--color-palm);
  --popover: var(--color-limestone);      --popover-foreground: var(--color-palm);
  --primary: var(--color-palm);           --primary-foreground: var(--color-limestone);
  --secondary: transparent;               --secondary-foreground: var(--color-palm);
  --muted: var(--color-limestone);        --muted-foreground: var(--color-palm-muted);
  --accent: var(--color-flag);            --accent-foreground: var(--color-limestone);
  --destructive: var(--color-palm);
  --border: var(--color-frond);
  --input: var(--color-flag);
  --ring: var(--color-flag);
  color-scheme: light;
}
```

Delete the `.dark { … }` block from `globals.css`. Mount `<ThemeProvider forcedTheme="light" enableSystem={false}>` (Appendix A) so an OS dark preference and the `d` hotkey can never flip shadcn neutrals onto the page. The `toaster` reads `--popover` and so follows the ground of the section that fires it; the contact toast fires inside `[data-ground="limestone"]`.

### 2.3 Responsive token overrides

```css
@media (max-width: 767px) {
  :root { --section-pad: 12vh; --measure: 100%; }
}
```

### 2.4 Single source of colour

CSS is the only place a hex value is written. `lib/design/palette.ts` exports `readPalette()` which reads `--color-*` from `getComputedStyle(document.documentElement)` once at canvas mount and returns `THREE.Color` instances for `slab`, `shade`, `limestone`, `palm`, `mist`. The SSR SVG (§4.7) fills with `var(--color-mist)` / `var(--color-shade)` / `var(--color-slab)`. A colour can therefore never drift between DOM and WebGL. The committed bitmaps (§4.5) carry no colour.

### 2.5 Contrast table (WCAG 2.x, computed)

| Foreground | Ground | Ratio | Permitted use |
|---|---|---|---|
| Limestone #EEEAE1 | Palm #0F452A | 9.18 | body, display, UI text (AAA) |
| Mist #A9BFB0 | Palm | 5.65 | secondary text, placeholders, captions (AA); UI edges (>3:1) |
| Aldebaran #E9A15A | Palm | 5.10 | focus ring, CTA hover fill (non-text); Palm text on Aldebaran 5.10 |
| Frond #3C8A5E | Palm | 2.62 | decorative only (slab lit-edge tint). Never text, never a UI edge on Palm |
| Palm #0F452A | Limestone #EEEAE1 | 9.18 | body, display, UI text (AAA) |
| Palm-muted #37634B | Limestone | 5.74 | secondary text on Limestone (AA) |
| Flag #006C35 | Limestone | 5.47 | links, focus ring, filled weave cells, input underlines |
| Frond #3C8A5E | Limestone | 3.51 | rules, empty weave-cell outlines (UI ≥3:1). Never text |
| Aldebaran | Limestone | 1.80 | **forbidden**; this failure is what polices the accent cap |
| Palm | Row-tint #C3D3C2 | 7.04 | portfolio row hover |
| Limestone (light) | Slab #1B5A39 | 6.81 | 3D lit faces (informational) |
| Mist (SVG top face) | Slab (SVG ground) | 4.19 | SSR / no-WebGL relief legibility |
| Limestone | Shade #0A2F1D | 12.17 | 3D only |

Rules enforced as tokens, not taste: Aldebaran has exactly three roles (cursor, focus ring on Palm, primary CTA hover fill) and never appears on Limestone. Frond is never text. Mist is never used on Limestone (1.62:1). Secondary text on Limestone is `--color-palm-muted`, nothing else.

---

## 3. Typography

### 3.1 Families (Google Fonts, all verified live with the axes below)

| Role | Family | `next/font/google` export | Load | Subsets |
|---|---|---|---|---|
| Display, Latin | Anybody | `Anybody` | variable wght 100–900, `axes: ["wdth"]` (50–150) | latin |
| Display, Arabic | Reem Kufi | `Reem_Kufi` | variable wght 400–700 | arabic, latin |
| Body, bilingual | IBM Plex Sans Arabic | `IBM_Plex_Sans_Arabic` | static 400, 500, 600 | arabic, latin |
| Utility / mono | Martian Mono | `Martian_Mono` | variable wght 100–800, `axes: ["wdth"]` (75–112.5) | latin |

`app/layout.tsx` (replaces Geist / Geist_Mono):

```ts
import { Anybody, Reem_Kufi, IBM_Plex_Sans_Arabic, Martian_Mono } from "next/font/google"

export const anybody = Anybody({
  subsets: ["latin"], axes: ["wdth"], variable: "--font-anybody", display: "swap",
})
export const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"], variable: "--font-reem-kufi", display: "swap",
})
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"], weight: ["400", "500", "600"], variable: "--font-plex-arabic", display: "swap",
})
export const martianMono = Martian_Mono({
  subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap",
})
// <html className={cn(anybody.variable, reemKufi.variable, plexArabic.variable, martianMono.variable, "font-sans antialiased")}>
```

Two hard rules. (1) `axes: ["wdth"]` is mandatory on Anybody and Martian Mono; without it next/font strips the axis and the entire width system silently becomes nothing. (2) Canvas rasterisation must use `anybody.style.fontFamily` / `reemKufi.style.fontFamily` (next/font renames families to `__Anybody_xxxx`); a literal `"Anybody"` in `ctx.font` falls back to the system font with no error.

### 3.2 Type scale

`wdth` is set with `font-variation-settings: "wdth" var(--wdth)` on a wrapper; never with `transform: scaleX`. Arabic is never scaled horizontally and never split at character level.

| Role | Family / weight | Size | Line-height | Letter-spacing | Width axis | Arabic setting (AR mode) |
|---|---|---|---|---|---|---|
| display-xl | Anybody 900 | `clamp(2.75rem, 11vw, 10.5rem)` (44px at 390, 168px max) | 0.9 | −0.02em | rest 118; live 50–150 (≥768px), 50–115 (<768px) | Reem Kufi 700; size ×0.85; LH 1.15; LS 0; live wght 400–700 replaces width |
| display | Anybody 800 | `clamp(2rem, 6.5vw, 5.5rem)` | 0.95 | −0.015em | 100 fixed | Reem Kufi 700; ×0.85; LH 1.2 |
| h2 | Anybody 700 | `clamp(1.25rem, 2.2vw, 2rem)` | 1.05 | −0.01em | 100; hover 130 (portfolio titles) | Reem Kufi 600; ×0.9; LH 1.3; hover wght 700 |
| h3 | IBM Plex Sans Arabic 600 | 1.125rem | 1.4 | 0 | — | same family, same size |
| body | IBM Plex Sans Arabic 400 | 1.0625rem (17px) desktop; 1rem <768px | 1.55 | 0 | — | same family; LH 1.7 |
| small | IBM Plex Sans Arabic 500 | 0.8125rem (13px) | 1.4 | 0.01em | — | same family; LS 0 |
| mono | Martian Mono 400 | 0.8125rem (13px); manifest 0.875rem; readout 0.6875rem (11px) at <768px | 1.5 | 0.02em | wdth 90; 75 in weave-mark labels and the mobile readout | falls back to Plex Sans Arabic 500 for Arabic strings; digits via `Intl.NumberFormat("ar-SA")` |
| input (hero) | Anybody 500 | 1.5rem (1.25rem <768px) | 1.3 | 0 | 100 | Reem Kufi 500, ×0.9 |
| button | Anybody 700 | 1rem | 1 | 0 | 100; hover 112 with reserved min-inline-size | Reem Kufi 600 |

Capped rule: on any line where Anybody shares a baseline with Reem Kufi (the RIYADH / الرياض pair), Anybody is capped at wght 700 so the Arabic is never the lighter script. If the team later wants a true 900 pair, `Noto_Kufi_Arabic` (100–900) is the drop-in swap for Reem Kufi.

---

## 4. Signature element — The Stele

### 4.1 What it is

One standing stone, portrait 2:3, filling 62vh at the right of the hero on desktop. Its face is a lattice of 96×144 cells. Cells rise in relief to spell a word, and the word is written by light: raised cells catch the key light on their lit faces and throw shadows across the flat stone. On load the relief ripples up from the right and reads نبني. As you scroll, the slab yaws to face you and re-carves, column by column, into WE BUILD. If you type into the hero it re-carves to your words, in Latin or Arabic. The cursor is the sun: moving it changes the light's azimuth and elevation, so you rake light across the stone to read it. The stone then recedes to the right column and stays through the capabilities section, carving each capability word as it becomes active; at the end of capabilities the sun climbs to noon, the shadows collapse and the word dissolves into flat stone. At contact the stone returns beside the form under first light, carrying the visitor's brief, which is also pre-filled into the request.

### 4.2 Scene

- `components/stele/stele-canvas.tsx`, imported with `next/dynamic({ ssr: false })` from a client component. It uses the scaffold's `SceneCanvas` with `frameloop="demand"`, `pauseOffscreen={false}` (see lifecycle below), `maxDpr` 1.5 (Tier A) / 1 (Tier B), `shadows` (Tier A only), `gl={{ antialias: true }}` (override the wrapper's `false`: the cell edges are the whole picture). `SceneCanvas` must be changed so the passed `frameloop` is honoured while running: `frameloop={running ? (frameloop ?? "always") : "never"}` (Appendix A).
- **Fine pointers**: one canvas in a fixed, full-viewport layer (`position: fixed; inset: 0; z-index: 0; pointer-events: none`) behind the page grid, `aria-hidden`, with an `sr-only` sibling: "A carved stone reading 'we build' in Arabic; it re-carves to whatever you type above." Its slab is placed onto DOM anchor rects (§4.6), so it can sit in the hero's right column, the capabilities sticky column and the contact column without remounting.
- **Coarse pointers**: two in-flow canvases, one inside the hero's stone block (42svh) and one inside the contact stone block (40svh), each clipped by its block (`overflow: hidden`). Nothing fixed, so the slab can never draw over the readout, the sub or the form. The two mounts share `steleState` and the masks; only the GL context is per mount.
- **Lifecycle (fine pointers)**: `SceneCanvas`'s IntersectionObserver would always see a fixed full-viewport wrapper as intersecting, so it is not the gate. An `active` boolean in `steleState` is driven by section ScrollTriggers: `true` from load through the end of capabilities (`onLeave` of `#capabilities` → `false`), `true` again on `onEnter` of `#contact` (`start: "top 80%"`), `false` on `onLeaveBack`. `active === false` sets `frameloop="never"` and `visibility: hidden` on the wrapper; the canvas stays mounted so the GL context is created once per session. Reverse scrolling re-activates through the mirrored `onEnterBack` / `onLeaveBack` callbacks.
- Camera: `PerspectiveCamera` fov 28 at (0, 0, 4.85), looking at the origin, never moved. Visible height at z = 0 is ≈2.42 world units; `placeSlab(rect)` (§4.6) positions and scales `slabGroup` in the z = 0 plane so the slab lands on whichever DOM anchor rect is current (a 62vh-tall rect makes the 1.5-unit slab scale 1.0). A long lens flattens perspective; that is what makes it read as a monument rather than a toy.
- Slab body: `BoxGeometry(1.0, 1.5, 0.12)`, `MeshStandardMaterial({ color: slab, roughness: 0.95, metalness: 0 })`. Slab and cells live in one `Group` (`slabGroup`) so yaw, position and scale are applied once.
- Lights: one `DirectionalLight` (colour Limestone, intensity 2.2, `castShadow` on Tier A, `shadow.mapSize` 1024, `light.target = slabGroup`, orthographic shadow camera sized to the hero placement and rescaled with `slabGroup.scale`: left/right ±0.65, top/bottom ±0.9, near 0.5, far 8, `bias −0.0005`, `normalBias 0.02`), positioned each frame at `slabGroup.position + 4 · slabGroup.scale · (cos el · sin az, sin el, cos el · cos az)`. One `HemisphereLight` (sky Palm, ground Shade, intensity 0.35). No ambient light. No post-processing: no bloom, no grain, no vignette.

### 4.3 Cells (the relief)

- One `InstancedMesh(BoxGeometry(cellSize, cellSize, 1), COLS·ROWS)`, box geometry translated +0.5 on z so its back face sits at local z = 0 and the instance's z-scale **is** the relief depth. `instanceMatrix.setUsage(DynamicDrawUsage)`.
- Pitch = 1/COLS world units; cellSize = 0.94 × pitch (a 6% gap keeps the lattice visible under raking light while strokes still read continuous).
- Base depth 0.004; raised depth 0.004 + `depth` where `depth` is a JS variable bound to scroll (0.035 at rest, 0.012 at noon).
- Relief is written as geometry (matrix z-scale), never as a vertex-shader displacement. This is why the shadow pass, depth buffer and any future AO see the raised cells with no `customDepthMaterial`.
- Two `Float32Array`s in JS: `heightA` (current 0..1 per cell) and `heightB` (target 0/1), plus `delay[i] = 0.18 + 0.64 · u + 0.08 · hash(i)` where `u = col/COLS` for Latin (LTR) or `1 − col/COLS` for Arabic (RTL). The range is normalised so that every cell completes within `mix ∈ [0, 1]` (the smoothstep half-width is 0.18): no carve ends with a snap on its trailing edge. The same formula drives the load ripple, the hero morph and the capability carves.
- Relief update: during any tween (`mix` 0→1) a plain loop runs over all cells each frame: `t = smoothstep(delay − 0.18, delay + 0.18, mix); h = lerp(heightA, heightB, t); zScale = 0.004 + h · depth`; compose the matrix (translation on the face at z = 0.06, plus z-scale) with one reusable `Object3D` or by writing the 16 floats directly; `instanceMatrix.needsUpdate = true`; `invalidate()`. Outside a tween nothing runs.
- Retargeting mid-carve: before a new target is set, bake the current interpolated `h` of every cell into `heightA`, then write the new `heightB` and reset `mix` to 0, so cells in transition continue from where they are and never pop.

### 4.4 Grid tiers

| Tier | Selector | Grid | Instances | Shadows | DPR | Brief cap | Cells per character (3 lines Latin) |
|---|---|---|---|---|---|---|---|
| A | `(pointer: fine)` and frame time ≤ 20ms | 96×144 | 13,824 | real (1024 map) | ≤1.5 | 40 chars, ≤3 lines | 7.2 cells advance, ≈10 cells cap height |
| B | `(pointer: coarse)` **or** measured frame time > 20ms over 60 consecutive frames | 64×96 | 6,144 | off; fake cast shadow via `setColorAt` | 1 | 24 chars, ≤2 lines | 5.3 cells advance, ≈7.4 cells cap height |

Tier B fake shadow: for every flat cell whose neighbour toward the light (`col + sign(sin az)`, `row + sign(sin el)`) is raised, `setColorAt(i, shade)`; all other cells `slab`. `instanceColor.needsUpdate = true` in the same loop. Zero shader cost, one-cell cast shadow.

Tier demotion is one-way for the session and re-rasterises the current word at the new grid.

### 4.5 Data: text → bitmask

`lib/three/raster-bitmask.ts` (sibling of the scaffold's `sample-text.ts`, which returns points; this returns a mask):

```ts
rasterizeToBitmask({ text, cols, rows, script, fontFamily, weight, stretch, maxLines, maxChars }): Uint8Array
```

- Draw on an `OffscreenCanvas` at 2× the grid (192×288 or 128×192), then downsample: a cell is raised if ≥2 of its 4 pixels have alpha > 128.
- Latin: `ctx.font = \`900 ${size}px ${anybody.style.fontFamily}\``, `ctx.fontStretch = "extra-expanded"` (150%, Anybody's maximum; Chromium 110+; Safari ignores `fontStretch` and rasterises weight-only, which still reads). Uppercase the text.
- Arabic (detected by `/[؀-ۿ]/`): `ctx.font = \`700 ${size}px ${reemKufi.style.fontFamily}\``, `ctx.direction = "rtl"`, `ctx.textAlign = "right"`; the browser's shaper joins the letters, which is the guarantee the Kufic is never misspelled.
- Wrap with `measureText` to ≤ `maxLines`; shrink `size` until the widest line fits `cols − 4` cells and the block fits `rows − 8`; `maxChars` is enforced by the input's `maxlength` (40 / 24) so the cap-height floor of 8 cells always holds. A dev-only assertion logs if a raster's cap height falls below 8 cells.
- `await document.fonts.load(font)` for both faces before the first raster; the canvas mounts after `document.fonts.ready`.
- The two fixed words (نبني, WE BUILD) are **not** rasterised at runtime on the first render. They are committed in `lib/stele/bitmaps.ts` as hex-row strings (≈1.7 KB per Tier A mask, one entry per tier) and feed the SSR SVG, the no-WebGL path and the first canvas frame, so all three agree. They are produced by a dev-only page, `app/dev/stele-bitmaps/page.tsx` (returns 404 unless `NODE_ENV === "development"`), which runs the very same `rasterizeToBitmask` in the browser with the very same next/font families and prints the hex rows for each tier to copy into `bitmaps.ts`. No Node canvas, no font download step: a server-side rasteriser cannot be trusted to match the browser's `fontStretch` handling or Arabic shaping, and agreement between SSR and runtime is the whole point. A dev-only check in `stele-canvas.tsx` compares the runtime raster of نبني to the committed mask and warns on drift (font version change), which is the cue to regenerate.

### 4.6 Interaction and scroll binding

**Light (the sun)**. Store: a module-level mutable `steleState` (`az`, `el`, `targetAz`, `targetEl`, `mix`, `depth`, `word`, `raised`, `total`), no React state on the hot path.

- Fine pointer: `targetAz = (mx − 0.5) · 140°`, `targetEl = 12° + (1 − my) · 30°` from normalised viewport pointer position; lerp 0.08 per frame; `invalidate()` only while |Δ| > 0.05°.
- Coarse pointer: `targetAz` and `targetEl` are bound to scroll through the hero block (az −70° → 0°, el 12° → 40° as the block travels from entering to leaving the viewport), plus a horizontal touch drag over the stone (`touch-action: pan-y` on the stone's DOM rect) nudges `targetAz` by ±40° while dragging, decaying back over 800ms.
- Contact section: fixed first light, az −35°, el 22°.

**Carving**. Input debounced 300ms → `rasterizeToBitmask` → write `heightB` → `gsap.to(steleState, { mix: 1, duration: 1.1, ease: "power3.inOut", onUpdate: invalidate, onComplete: () => { heightA.set(heightB); steleState.mix = 0 } })`. "Carve it" stores the text in `sessionStorage["stele:brief"]` for the contact form and sets `steleState.word`.

**Placement (fine pointers)**. Three empty anchor `div`s give the slab its rects: `#stele-anchor-hero` (cols 8–12, 62vh tall, portrait 2:3), `#stele-anchor-capabilities` (cols 9–12, 22vw wide, in the sticky column with `top: calc(var(--nav-h) + 8vh)`), `#stele-anchor-contact` (cols 8–12, 28vw wide). `placeSlab(rect)` converts a DOM rect to the z = 0 plane (`worldPerPx = visibleWidth / innerWidth`, origin at viewport centre) and sets `slabGroup.position.x/y` and a uniform `slabGroup.scale = rect.height / (0.62 · innerHeight)`; the readout is positioned under the same rect. Rects are read inside the Lenis scroll callback (not rAF) so they never lag the smoothed scroll by a frame, and on resize.

**Hero scroll (fine pointer, pinned 200vh, scrub 0.6)** — a single GSAP timeline on a ScrollTrigger (`trigger: #hero, start: "top top", end: "+=200%", pin: true, scrub: 0.6, anticipatePin: 1`):

| Progress | Stone | Type / DOM |
|---|---|---|
| 0.00–0.40 | `slabGroup.rotation.y` 18° → 0°; morph نبني → WE BUILD (or the typed brief) driven by `mix` (time-based tween fired once when progress crosses 0.05, not scrubbed, so the carve always looks clocked) | H1 wdth 118 → 50 and rises 12vh; sub, input row, tool line and CTA hold |
| 0.40–1.00 | `placeSlab` interpolates between the hero anchor rect and the capabilities anchor's **stuck** rect, computed deterministically (cols 9–12 × 22vw at `top = navH + 8vh`) rather than measured, so the slab lands exactly where the sticky column will hold it; continuous raking light; `depth` stays 0.035 | H1 continues out of frame; sub/input/CTA fade 0.55–0.75 (opacity only) |

At unpin, `placeSlab` switches to the live capabilities anchor with its `top` clamped to `max(rect.top, navH + 8vh)`, so there is no jump below the fold and no travel back up as the sticky engages. Reverse scroll re-carves toward the previous word seeded from the opposite edge (`delay` reversed).

**Capabilities**. On active-index change the stone carves the capability word (`WEB`, `MOBILE`, `DESKTOP`, `API`, `AI`, or the Arabic word in AR mode) with a 0.6s ripple; carves fire only on index change and never overlap (a new index during a carve bakes the current heights into `heightA`, retargets `heightB` and restarts `mix` from 0, §4.3). Over the last 40vh of the section a scrubbed ScrollTrigger drives `el` → 82° (noon), `depth` 0.035 → 0.012, then wrapper opacity 1 → 0 over the final 20vh; `onLeave` sets `steleState.active = false` (§4.2 lifecycle).

**Contact**. `onEnter` of `#contact` (`start: "top 80%"`) sets `active = true`, restores `depth` 0.035, sets the fixed first light, places the slab on `#stele-anchor-contact` and fades the wrapper in over 400ms showing `steleState.word` (the brief, or نبني if none was typed). Typing in the contact textarea does not re-carve (that surface is the form; the stone shows what was carved).

**Coarse pointer hero (no pin)**. The hero is a normal flow block and its canvas is in-flow inside the 42svh stone block (§4.2). The camera is the same (0, 0, 4.85); the block's aspect is landscape, so `placeSlab` scales the slab to the block's height × 1.35 and offsets it so the carved band (the upper 70% of the face, where the wrapped word sits) fills the block while the block clips the rest. Load ripple as on desktop. When the stone block's top crosses 30% of the viewport height while scrolling down (`ScrollTrigger onEnter`, once), a time-based 0.9s morph to WE BUILD (or the brief) fires. The light follows scroll and drag as above. The hero canvas goes `frameloop="never"` once the block leaves the viewport (this in-flow mount can use `SceneCanvas`'s IntersectionObserver as-is). There is no capabilities stone on Tier B; the words still act as buttons and the ledger still follows. The contact block has its own in-flow canvas (40svh, full width, above the form).

**Early-scroll rule** (graft): if the visitor scrolls (fine: hero progress > 0.02; coarse: the stone block leaves the top 30%) before the load ripple completes, the ripple tween jumps to `progress(1)`. Nothing is ever half-carved.

### 4.7 SSR placeholder and no-WebGL path

`components/stele/stele-svg.tsx` is a server component that renders the committed نبني mask as an inline `<svg viewBox={\`0 0 ${cols} ${rows}\`} preserveAspectRatio="xMidYMid meet">` (the viewBox derives from the mask's own dimensions, so a Tier B client re-render at 64×96 is never stretched) with exactly three elements: a ground `<rect fill="var(--color-slab)">`, one `<path fill="var(--color-shade)">` of run-length-merged side faces (each raised run drawn at offset +0.35, +0.35 cell units) and one `<path fill="var(--color-mist)">` of run-length-merged top faces. Runs are merged per row (`M x y h w v 1 h -w z`), so the نبني SVG is ≈4 KB. It sits in the DOM at the stone's rect and is the server-rendered first paint, so LCP is the H1 text plus this SVG, never the canvas. When the canvas has rendered its first frame it crossfades over the SVG (200ms) and the SVG gets `hidden`. If WebGL is unavailable, the context is lost, or the canvas has not mounted within 400ms of `fonts.ready`, the SVG stays; typing then re-renders the SVG client-side from the runtime mask (same run-length routine) with no animation. Social crawlers and print see the SVG.

### 4.8 Inscription readout (graft)

A single Martian Mono line under the stone, positioned to the stone's projected rect (hero and contact on desktop; a normal-flow line under the stone block on mobile; under the stone in the sticky column during capabilities):

`{word} · {raised}/{total} cells · light {az}° {el}°` — e.g. `نبني · 1,412/13,824 cells · light 214° 22°`

- Written to a text node from `useFrame` via a ref at most 10×/s during tweens; static otherwise. Numbers count up as the ripple raises cells (raised = count of `h ≥ 0.5`), so the load animation is evidence of computation, not a preloader.
- 13px, wdth 90, Mist on Palm; 11px, wdth 75 on mobile. On Limestone (contact) Palm-muted.
- AR mode: digits through `Intl.NumberFormat("ar-SA")`; order preserved (the line is `dir="auto"`).
- Reduced motion: final values, no counting.

### 4.9 Performance budget

| Item | Tier A | Tier B |
|---|---|---|
| Draw calls | 2 (+1 shadow pass) | 2 |
| Instances / triangles | 13,824 / 166k | 6,144 / 74k |
| CPU per frame during a carve | ≈1.5 ms (13.8k matrix composes) | ≤4 ms (6.1k composes + colours) |
| CPU per frame idle | 0 (demand frameloop; the stone does nothing until you do) | 0 |
| DPR | ≤1.5 | 1 |
| Textures | none | none |
| Post-processing | none | none |
| JS heap for masks | < 60 KB | < 30 KB |
| Frames rendered on pointer move | only while |Δlight| > 0.05° | only during scroll/drag |
| Width-lens reflow | ≤2 elements animating, `contain: layout paint` wrappers | same; range 50–115 |

Frame-time watchdog: sample `performance.now()` deltas in `useFrame`; 60 consecutive frames > 20ms demotes to Tier B.

### 4.10 Reduced motion

`prefers-reduced-motion`: no pin, no scrub, no ripple, no light lerp, no width animation. The stone renders once with `frameloop="never"` after `fonts.ready`: fixed first light (az −35°, el 22°), reading نبني, no yaw. Typing still re-carves, but `mix` jumps to 1 with no tween and the readout shows final numbers. Capability words all sit at wdth 110 with all five ledgers visible; the stone in capabilities shows the word of the button last activated (instant). Scroll into contact shows the stone instantly. The cursor is native.

---

## 5. Sections (page order)

Section ids match `site.config.ts` nav (updated in Appendix A): `hero`, `capabilities`, `work`, `team`, `kingdom`, `contact`. Grounds: Palm, Palm, **Limestone**, Palm, Palm, **Limestone**.

### 5.1 `nav` — frame

**Purpose**: keep the frame nearly invisible so type and stone own the page; carry the language switch that proves the bilingual claim.

**Content**: wordmark as plain text (`site.name`, Anybody 700 wdth 110, 1.125rem; the brand name is replaceable and nothing is built on its letterforms) · section links Work / Capabilities / Team / Riyadh (mono 13px, Mist; ≥1024px only) · `EN | عربي` toggle (mono; the active side is the inversion device, like every emphasis on the page: a Limestone chip with Palm text on Palm grounds, a Palm chip with Limestone text on Limestone grounds; the inactive side is Mist / Palm-muted) · primary button **Book a build call** (Limestone block, Palm type, 44px tall). Skip link "Skip to content" is the first focusable element. Mobile: wordmark, toggle, CTA (links live in the footer; no hamburger, nothing to hide).

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Excelerator      Work  Capabilities  Team  Riyadh        EN | عربي  ▐Book a build call▌ │
└─────────────────────────────────────────────────────────────────────────────┘
 56px · transparent over the current ground · text colour flips on Limestone sections
```

Sticky, 56px, `backdrop-filter: none`. A sentinel ScrollTrigger per Limestone section toggles `data-ground` on the nav so its text and CTA invert (`toggleClass`).

**Motion**: fades in last in the load sequence (1800ms). Hides on scroll-down, returns on scroll-up (translateY −100%, 240ms, `studioInOut`), never hides while a Sheet or the form has focus. Link hover: wdth 100 → 120 over 200ms, underline Frond → current foreground. Toggle: flips `document.documentElement.lang/dir`, wraps the app in base-ui `DirectionProvider`, re-runs the display-line reveals in the new reading direction and flips the stele's ripple direction. Reduced motion: instant.

**Responsive**: ≥1024 full row; 768–1023 links hidden; <768 wordmark + toggle + CTA, CTA label shortens to **Book a call**.

### 5.2 `hero` — The Stele

**Purpose**: in five seconds, one monumental sentence, one carved stone, one question that makes the claim testable, and the engineering visible before the fold.

**Content**:

- H1: **Bring us the hard one.**
- Sub: *In-house engineers in Riyadh who ship web, mobile, desktop and AI systems for founders, enterprises and government programs.*
- Question (h3, Plex 600): **What do you want to build?**
- Input: ruled line, placeholder cycles every 3s in Mist (stops on focus): *a commodities trading platform* / *an Arabic-first real-estate marketplace* / *ZATCA Phase 2 e-invoicing for an e-commerce stack* / *a RAG assistant over 40,000 Arabic contracts* / *an air-quality sensor network with live alerts*. `maxlength` 40 (24 on Tier B), `autocomplete="off"`, `inputmode="text"`, label visually the question above. Charset: anything the shaper can draw; the text goes only to the canvas and `sessionStorage`, never to analytics or the server until the visitor submits the contact form.
- Button: **Carve it** (Limestone block, Palm type).
- Tool line (mono, Mist, static): `Next.js · Django · Laravel · Flutter · React Native · Electron · GraphQL · vLLM · MCP`
- Primary CTA: **Book a build call** (scrolls to `#contact` via `useLenis().scrollTo`).
- Stone reads نبني; readout under it.
- Arabic accent register: نبني (nabni), "we build".

**Layout (desktop, fine pointer, pinned 200vh)**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ cols 1–7                                        │ cols 8–12                  │
│                                                 │  ┌────────────────────┐    │
│  Bring us                                       │  │▒▒░░▒▒▒░░▒░░▒▒░▒▒░░│    │
│  the hard                                       │  │▒░░▒░░░▒░▒░░░▒░▒░░▒│ 62vh│
│  one.            Anybody 900 · display-xl       │  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│    │
│                  wdth 118 → 50 on scroll        │  │░░▒▒░▒▒░░▒▒▒░░▒░░▒▒│    │
│                                                 │  │  reads نبني        │    │
│  In-house engineers in Riyadh who ship …        │  └────────────────────┘    │
│                                                 │  نبني · 1,412/13,824 cells │
│  What do you want to build?                     │  · light 214° 22°          │
│  a commodities trading platform______________   │                            │
│  ▐Carve it▌                                     │        ☉ cursor = the sun  │
│  Next.js · Django · Laravel · Flutter · … · MCP │                            │
│                                                 │                            │
│  ▐Book a build call▌                            │                            │
└──────────────────────────────────────────────────────────────────────────────┘
 H1 starts at 14vh below the nav · each H1 line in its own overflow-clipped, fixed-width
 contain:layout wrapper so width changes never reflow the sub · stone rect = the SSR SVG rect
```

**Layout (coarse pointer, unpinned)**:

```
┌──────────────────────────────┐
│ Bring us the hard one.       │  12vw · 3 lines · wdth 105 static
│ ┌──────────────────────────┐ │
│ │ ▒▒░░▒▒▒░░▒░░▒▒░▒▒░░▒▒░░▒ │ │  42svh · full width · camera framed on the
│ │ ▒░░▒░░░▒░▒░░░▒░▒░░▒░░▒░░ │ │  carved band (upper 70% of the face) · full opacity
│ └──────────────────────────┘ │  · no text ever overlaps the canvas
│ نبني · 612/6,144 · light −70° 12°│
│ In-house engineers in Riyadh…│
│ What do you want to build?   │
│ a commodities trading platf__│
│ ▐Carve it▌                   │
│ Next.js · Django · … · MCP   │
│ ▐Book a build call▌          │
└──────────────────────────────┘
```

**Motion**: load sequence §6.1. Scroll: §4.6. Pointer: the light. Input: debounced re-carve; "Carve it" compresses its label wdth 100 → 70 → 100 over 240ms like a stamp, then the stone carves. Reduced motion: static stone, everything visible at first paint.

### 5.3 `capabilities` — What we build (the width lens)

**Purpose**: prove range with the five real capability areas and let the type do the pointing: width equals attention, and the stone carves whatever is being pointed at.

**Content** (source `content/capabilities.ts`, new fields `arShort`, `line`, `ledger`; existing `stack` and `deliverables` stay for the AR ledger and future use):

| Word | AR word (`arShort`, native review required) | `line` | `ledger` |
|---|---|---|---|
| WEB | الويب | Frontend and backend, one team. | Python (Django, FastAPI) · PHP (Laravel) · TypeScript (Next.js, Node) |
| MOBILE | الجوال | One codebase, both stores, RTL from day one. | Flutter · React Native |
| DESKTOP | سطح المكتب | Windows and macOS apps wired to your backend. | Electron |
| API | الواجهات | Documented well enough for your next vendor to read. | GraphQL · REST · schema-first documentation |
| AI | الذكاء | Arabic-capable models on your data, on your infrastructure. | LLM fine-tuning · RAG pipelines · MCP servers · agents |

Section eyebrow (small, Mist): **What we build**. The weave-mark legend is introduced under the ledger: five 10px cells in this fixed order WEB MOBILE DESKTOP API AI, filled Limestone / outlined Mist on Palm, reused in `work`.

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT WE BUILD (eyebrow)                                                      │
│ cols 1–7                                  │ cols 9–12 · sticky (top: nav+8vh) │
│                                           │  ┌──────────────┐                │
│   WEB        wdth 50 · Mist · spire       │  │ ▒▒░░▒▒▒░░▒░░ │ 22vw wide      │
│   MOBILE     wdth 50                      │  │ ▒░░▒░░░▒░▒░░ │ carves DESKTOP │
│  ▐DESKTOP▌   wdth 150 · Limestone · slab  │  └──────────────┘                │
│   API        wdth 50                      │  DESKTOP · 3,204/13,824 · light … │
│   AI         wdth 50                      │  Electron                (mono)   │
│                                           │  Windows and macOS apps wired     │
│  each word = <button aria-pressed>        │  to your backend.        (h3)     │
│  in a fixed-width contain:layout box      │  ▣▣▣▣▣ WEB MOBILE DESKTOP API AI  │
│  no numbers · no icons · no cards         │                                   │
└──────────────────────────────────────────────────────────────────────────────┘
 word pitch = 1em + 20vh so each word holds the centre band for ≈40vh · section min-height 240vh
```

**Motion**: one ScrollTrigger `onUpdate` measures each word's distance `d` from a centre band (viewport centre ± 0.1vh) and writes a CSS custom property via `gsap.quickSetter`: `wdth = 50 + 100 · eased(1 − |d| / 0.6vh)` clamped to [50, 150] (115 on <768px). Never more than two words animate at once (the two nearest the band). Active = nearest word: wdth 150, wght 900, Limestone; others wdth 50, wght 700, Mist. On active-index change: ledger crossfades 250ms and the stone carves the word (0.6s ripple, fine pointers only). Keyboard: each word is a `<button aria-pressed>`; Enter/Space or ArrowUp/ArrowDown sets the active index, scrolls the word into the band (`lenis.scrollTo`) and carves; the scroll binding resumes on the next wheel/touch event. Section exit (last 40vh): sun to noon, relief to 0.012, canvas fades (§4.6). AR mode: Reem Kufi words, wght 400 ↔ 700 replaces wdth, lens direction unchanged (vertical), ripple RTL. Reduced motion: all five at wdth 110 with all five ledgers stacked; buttons still carve (instant).

**Responsive**: <768px words run full width at 20vw, range 50–115; the ledger sits directly under the active word (not sticky); no stone in this section on Tier B.

### 5.4 `work` — What we've built (inversion 1: Limestone)

**Purpose**: show project types and what was hard in each, so a buyer recognises their own thing in the list.

**Content** (source `content/projects.ts`; schema gains `hardPart: string` and `shippedAs: string[]`; `outcomes`, `year`, `seed` stay but are not rendered on this page). Eyebrow: **Project types. No client names.** Heading (display, Anybody 800 wdth 100): **What we've built**. Rows, in file order:

| Title (h2) | Sector (small) | Weave-mark (from `capabilities`) | Hard part | Stack (mono) | Shipped as |
|---|---|---|---|---|---|
| Precious-metals trading platform | Fintech | ▣▣▣▣▢ | Live gold and silver pricing, a double-entry ledger with a full audit trail, sub-second updates on a trader's desktop. | Next.js · Laravel · GraphQL · Flutter · Electron · Redis | web app · iOS + Android · desktop terminal |
| Real-estate marketplace | PropTech | ▣▣▢▣▢ | Arabic-first search over 100k+ listings, map search, agent CRM with automated lead routing. | Next.js · PostgreSQL · PostGIS · React Native · Meilisearch | web app · iOS + Android |
| Headless commerce with ZATCA e-invoicing | Retail | ▣▢▢▣▢ | Phase 2 clearance, UBL XML, a QR on every invoice, local gateways and cash on delivery. *(ZATCA scope to be confirmed by the team; drop the clause if not shipped.)* | Medusa · Next.js · PostgreSQL · local carriers | storefront · ops dashboard |
| Large-scale data extraction | Data | ▣▢▢▣▣ | Millions of pages a day with retry and dedupe, schema-validated output, alerts on drift. | Python · Playwright · Celery · PostgreSQL · ClickHouse | pipelines · GraphQL delivery API |
| Environmental monitoring dashboard | IoT | ▣▢▢▣▢ | Real-time ingestion from distributed sensors, time-series storage, threshold alerts by email and SMS. | Node.js · TimescaleDB · React · MQTT · Grafana | public dashboards · alerts |
| Arabic document intelligence | AI | ▣▢▢▣▣ | A fine-tuned Arabic model that beat the base on legal QA, citations on every answer, an MCP server for internal agents. | PyTorch · LoRA · pgvector · MCP · FastAPI · Next.js | assistant · MCP server |

Logistics fleet tracking and Government service portal from the direction draft are **not** included unless the team confirms they shipped them.

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────────────┐ Limestone
│ PROJECT TYPES. NO CLIENT NAMES.                                              │ Palm type
│ What we've built                                                             │
│ ─────────────────────────────────────────────────────────────── Frond 1px ── │
│ Precious-metals trading platform      Fintech      ▣▣▣▣▢              +      │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Real-estate marketplace               PropTech     ▣▣▢▣▢              −      │
│    Hard part   Arabic-first search over 100k+ listings, map search, …        │
│    Stack       Next.js · PostgreSQL · PostGIS · React Native · Meilisearch   │
│    Shipped as  web app · iOS + Android                                       │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Headless commerce with ZATCA e-invoicing   Retail   ▣▢▢▣▢             +      │
│ …                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
 rules are the accordion's edges (shadcn Accordion, type="multiple") and the only rules on the page
 weave cells: Flag filled, Frond outline, 10px, 2px radius, gap 3px · no images, no logos
```

**Motion**: rows reveal once on enter (masked line reveal, stagger 40ms, not scrubbed). Hover/focus on a row: title wdth 100 → 130 over 200ms, row ground → `--color-row-tint`, weave cells fill (outline → Flag) in reading order 30ms apart. Expand: 320ms height (`studioInOut`), detail lines fade in 60ms apart. AR mode: title in Reem Kufi 600, hover wght 600 → 700. Reduced motion: expand without animation, no width change.

**Responsive**: <768px each row is two lines: title; then sector + mark + toggle. Detail labels stack above values.

### 5.5 `team` — The bench

**Purpose**: answer "who actually builds this?" without inventing people: in-house, Riyadh, one team from scope to ship, and the real stack in the face an engineer trusts.

**Content**:

- Display line (display): **ONE TEAM FROM SCOPE TO SHIP**
- Body: *In-house engineers in Riyadh. No subcontracting. The people who scope your build are the people who ship it, and they stay on for the run.* *(claims "no subcontracting" and "stay on for the run" to be confirmed.)*
- Roles (from `content/team.ts`, `role` only; `count` is **not rendered**): Backend engineers · Frontend engineers · Mobile engineers · AI engineers · Platform and DevOps · Product designers — as one mono line.
- **The run** (from `content/process.ts`, the page's only numbering because it is a real sequence): 1 Discover (1 to 2 weeks) · 2 Design and architect (2 to 3 weeks) · 3 Build in sprints (2-week sprints) · 4 Launch (1 week) · 5 Run and hand over (ongoing). Each step shows its `description` on hover/focus/tap as a body-size sentence under the line.
- Statement under the run (graft): **You own the code, the infra and the docs from day one.** *(to be confirmed.)*
- Manifest (mono, new `content/stack.ts`):

```
frontend   next.js · react 19 · tailwind · three.js · gsap
backend    django · fastapi · laravel · node
mobile     flutter · react native · swift · kotlin
desktop    electron
api        graphql (apollo) · rest · openapi docs
data       postgresql · redis · pgvector · clickhouse · timescaledb
ai         pytorch · lora · vllm · mcp sdk · evals
infra      aws · docker · kubernetes · terraform · github actions · in-Kingdom regions
```

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────────────┐ Palm
│ cols 1–6                                 │ cols 7–12                          │
│ ONE TEAM FROM SCOPE TO SHIP              │ stack.manifest         (mono 14px) │
│ In-house engineers in Riyadh. No sub…    │ frontend  next.js · react 19 · …   │
│ Backend · Frontend · Mobile · AI · …     │ backend   django · fastapi · …     │
│                                          │ mobile    flutter · react native   │
│ THE RUN                                  │ desktop   electron                 │
│ 1 Discover ── 2 Design ── 3 Build ──     │ api       graphql (apollo) · …     │
│ 4 Launch ── 5 Run and hand over          │ data      postgresql · redis · …   │
│ (DrawSVG line joins the five)            │ ai        pytorch · lora · vllm …  │
│ You own the code, the infra and the docs.│ infra     aws · docker · k8s · …   │
└──────────────────────────────────────────────────────────────────────────────┘
 manifest: Mist keys, Limestone values, no rules, rows separated by spacing only
 no headcounts, no portraits, no avatars
```

**Motion**: manifest reveals once with a `clip-path: inset(0 0 100% 0)` → `inset(0)` wipe, 600ms `studio`. The run's five steps are joined by one SVG line drawn with DrawSVG on enter (800ms), then the step labels rise 8px 80ms apart. Reduced motion: none.

**Responsive**: stacked; the run wraps to a vertical list with the line drawn vertically.

### 5.6 `kingdom` — Built here, for here

**Purpose**: Saudi grounding as a demand → delivery mapping rather than stat tiles.

**Content** (new `content/kingdom.ts`):

- Bilingual line: **RIYADH** at the left edge, **الرياض** at the right edge, facing each other (Anybody 700 capped, Reem Kufi 700; display-xl scale at 10vw).
- Prose (body, measure 38rem): *Riyadh is the region's fastest-growing startup hub: more than two thousand startups, four unicorns, and a 2030 plan that needs software written for Arabic first, not translated later. We build for the teams working inside that plan, with SDAIA, Monsha'at, NEOM and KAUST programs, and for the regulators they answer to.*
- Mapping rows (need in Plex, Limestone; ship in mono, Mist):

| What the market needs | What we ship |
|---|---|
| ZATCA Phase 2 e-invoicing | UBL XML, QR codes, clearance and reporting integration |
| Arabic-first products | RTL layouts, Arabic search and NLP, Hijri and Gregorian dates |
| Government digital services | accessible portals, identity and payment integrations, bilingual parity |
| Data that stays in-Kingdom | on-prem or in-region RAG and fine-tuning on your infrastructure |
| Fintech and logistics at scale | real-time ledgers, fleet telemetry, audit trails |

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────────────┐ Palm
│ RIYADH                                                              الرياض   │ 10vw
│ (wdth 50 → 150 scrubbed)                        (wght 400 → 700 scrubbed)    │
│ Riyadh is the region's fastest-growing startup hub: more than two thousand   │ cols 1–6
│ startups, four unicorns, and a 2030 plan …                                   │
│                                                                              │
│ WHAT THE MARKET NEEDS                   →   WHAT WE SHIP              (mono) │
│ ZATCA Phase 2 e-invoicing               →   UBL XML, QR codes, clearance …   │
│ Arabic-first products                   →   RTL layouts, Arabic search …     │
│ Government digital services             →   accessible portals, identity …   │
│ Data that stays in-Kingdom              →   on-prem or in-region RAG …       │
│ Fintech and logistics at scale          →   real-time ledgers, fleet …       │
└──────────────────────────────────────────────────────────────────────────────┘
 rows separated by spacing, not rules · no numerals set large · no tiles
```

**Motion**: the bilingual line is scrubbed over 60vh as it enters: Latin wdth 50 → 150 and Arabic wght 400 → 700 in sync; no scaleX on the Arabic. Mapping rows reveal once (masked lines, 40ms stagger). Reduced motion: static at full width and weight.

**Responsive**: <768px the bilingual line stacks (Latin above Arabic, both at 16vw); mapping rows become need-over-ship pairs.

### 5.7 `contact` — Book a build call (inversion 2: Limestone)

**Purpose**: convert, and carry the carved brief into the request so the prospect's own words are the first line of the conversation.

**Content**:

- Heading (h2): **Book a build call**
- Form (shadcn Field / Input / Textarea, wired to `app/actions/contact.ts`, field mapping in Appendix A): *What do you want to build?* (textarea, prefilled from `sessionStorage["stele:brief"]`), *Name*, *Organisation*, *Work email*. Honeypot `website` retained. Button **Book a build call**. Secondary link *or email hello@[domain]* (`site.contact.email`).
- Success (in place, sonner toast on Limestone): **Request sent. We reply within one working day with times.** *(the one-working-day promise to be confirmed.)*
- Errors, in the voice: *Add the part after @ in your email.* / *Tell us in a sentence what you want to build.* / *Enter your name.* Error text is Palm with a 10px Flag cell marker before it; no red.
- Sidebar (mono, Palm-muted; graft of the datasheet base facts): `Riyadh, Saudi Arabia · AST (UTC+3) · Sun–Thu` and the email.
- The stone returns beside the form under first light, carrying the brief; readout under it.

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────────────┐ Limestone
│ cols 1–6                                   │ cols 8–12                        │ Palm type
│ Book a build call                          │  ┌───────────────────────┐       │
│ What do you want to build?                 │  │ ▒▒░▒▒░░▒▒░░▒░▒▒░░▒░▒▒ │ 28vw  │
│ [an Arabic-first real-estate marketplace ] │  │ ░▒░░▒░▒░░▒▒░░▒░░▒▒░▒░ │       │
│ Name             Organisation              │  └───────────────────────┘       │
│ [            ]   [               ]         │  AN ARABIC-FIRST … · 4,812/13,824 │
│ Work email                                 │  Riyadh, Saudi Arabia · AST (UTC+3)│
│ [            ]                             │  · Sun–Thu                        │
│ ▐Book a build call▌   or email hello@…     │  hello@…                          │
└──────────────────────────────────────────────────────────────────────────────┘
 inputs are Flag underlines (no boxes) · button = Palm block, Limestone type
 coarse pointers / <768px: in-flow stone block above the form at 40svh, then form, then sidebar
```

**Motion**: canvas re-enters (opacity 0 → 1 over 400ms, depth restored) under the fixed first light. Input underlines draw in reading direction on focus (DrawSVG on a 1px line, 200ms). Button press: label wdth 100 → 70 → 100 (240ms). Submit: button label unchanged while pending (a 10px cell pulses beside it); success replaces the form body with the sentence and fires the toast. Reduced motion: static stone, instant states.

### 5.8 `footer`

**Content**: wordmark · Work / Capabilities / Team / Riyadh / Contact (mono) · `EN | عربي` · *Riyadh, Saudi Arabia* · email · © year. One row on Palm; three rows at <768px. Motion: hover only.

---

## 6. Motion system

### 6.1 Load sequence (desktop, fine pointer)

| t | Event |
|---|---|
| 0 ms | Palm ground, nav hidden, SSR SVG stone at its rect (LCP = H1 text + SVG). The server-rendered readout shows only the word, `نبني`; the cell count and light angles are appended after mount, once the tier is known. |
| 0–1100 ms | Canvas mounts after `fonts.ready`, crossfades over the SVG (200ms) once its first frame is drawn. Key light rises from below the slab's left horizon: el −10° → 22°, az −35°, intensity 0 → 2.2 (`power2.out`): a raking sweep across flat stone. |
| 350 ms | H1 lines reveal through per-line clip wrappers, y 100% → 0 with wdth 60 → 118, 900ms `power4.out`, stagger 110ms (SplitText `type: "lines"`, `mask: "lines"`; Latin only, and lines only in AR mode). |
| 1000 ms | Relief ripples up right-to-left into نبني, 900ms `power3.inOut`; readout counts cells as they rise. |
| 1500 ms | Sub, question, input row, tool line, CTA fade up 8px, stagger 60ms, `studio`. |
| 1800 ms | Nav fades in (300ms). |
| any | If the visitor scrolls past hero progress 0.02 before 1900ms, the ripple jumps to `progress(1)`. |

Coarse pointer: same timings; the light rise is replaced by scroll-bound light (initial az −70°, el 12°). Reduced motion: everything at its final state at first paint with one 200ms opacity fade on the canvas over the SVG.

### 6.2 Scroll rules

- Lenis is the only smoother (scaffold `SmoothScroll`: `lenis.on("scroll", ScrollTrigger.update)` on the GSAP ticker, `syncTouch: false`). ScrollSmoother is never imported.
- `ScrollTrigger.config({ ignoreMobileResize: true })` in `lib/motion/gsap.ts`; `ScrollTrigger.refresh()` after `fonts.ready`, after the canvas mounts, and after the locale toggle.
- Pinning happens only under `(pointer: fine)` (matchMedia via `gsap.matchMedia()`), never by viewport width: an iPad at 1024px with an on-screen keyboard has the same input-in-pin problem as a phone. Coarse pointers get unpinned sections with time-based beats fired by `onEnter`.
- Scrubbed: hero (200vh, fine), capability lens (continuous), capability exit (noon, 40vh), kingdom bilingual line (60vh). Time-based, triggered once: the two carves in the hero, the capability carves, all reveals, DrawSVG lines. Nothing is both scrubbed and clocked.
- All scrubbed work is disabled under `prefers-reduced-motion`; one-shot reveals become instant opacity.

### 6.3 Cursor (extends `components/cursor/cursor.tsx`; styles go in `globals.css` under `.cursor`, which the scaffold references but does not yet define)

The sun. Mounted only for `(pointer: fine)` and not under reduced motion; native cursor otherwise (`.has-cursor * { cursor: none }` except form fields, which keep the native caret).

| State (`data-cursor`) | Look |
|---|---|
| default | 12px Aldebaran disc, 1px Palm outline (so it stays visible on Limestone); position via `gsap.quickTo` 0.14s `power3` |
| `stone` (over a stele rect) | disc + 160px soft radial halo `--color-halo`; the disc is the light source: pointer position → `steleState.targetAz/El` |
| `link` (links, buttons, capability words, portfolio rows) | 36px Aldebaran ring, 1.5px stroke; hovered links and portfolio titles widen (wdth +20). The five capability words are exempt: their width is owned by the scroll lens and never by hover, so over them the ring appears and nothing else changes |
| `input` (hero input, form fields) | 2px × 28px vertical Aldebaran bar, 2px radius: a wdth-50 spire; native caret stays |
| `hide` | hidden (over the toggle chips and the Sheet) |

Keyboard focus is independent and always visible: 2px Aldebaran ring, 3px offset on Palm; 2px Flag ring, 3px offset on Limestone. Never removed.

### 6.4 Hover and micro rules

- Links: wdth 100 → 120 over 200ms (the type leans in), underline Frond → current foreground. Reserved `min-inline-size` at the wide setting so nothing shifts.
- Buttons: inversion swap in 160ms (Limestone/Palm ↔ Palm/Limestone). The primary CTA's hover is the page's one Aldebaran fill, with Palm text (5.10:1). Active: translateY(1px).
- Input focus: the underline draws in reading direction (DrawSVG, 200ms).
- "Carve it": label wdth 100 → 70 → 100 (240ms), then the stone carves.
- Capability words: active state by scroll or keyboard; hover only shows the link cursor (no hover-driven width, so the lens is never a hover accordion).
- Portfolio rows: title widens, row tints, weave cells fill; expand 320ms.
- The run: step hover/focus shows its description (opacity 200ms).
- Language toggle: `dir` flips, display lines re-reveal in the new direction, ripple direction flips, DrawSVG underlines draw from the new start.
- Toasts (sonner) enter with a 240ms rise, no icon colour other than the current foreground.
- All micro-interactions are 160–320ms and use `studio` / `studioInOut` / the two new eases `carve` (power3.inOut) and `lift` (power4.out) registered in `lib/motion/gsap.ts`.

### 6.5 Reduced-motion rules (page-wide)

No Lenis (the provider already skips it), no pins, no scrubs, no width or weight animation, no ripple, no light lerp, no cursor, no cycling placeholder (first placeholder shown statically), no counting readout. State changes are instant; reveals are a single 200ms opacity. The stone renders once (§4.10).

---

## 7. Copy voice guide

Plain, engineer-to-buyer, sentence case. Verbs first. Specifics over adjectives: tool names, ZATCA Phase 2, UBL XML, PostGIS. No praise words, no "elevate", "empower", "unlock", "seamless". Numbers only where they are true and only inline at body size (two thousand, four; never a stat tile). Display words are set in caps only when they are on the stone or in the width lens. Buttons name the outcome and keep their name through the flow ("Book a build call" → "Request sent"). Errors say what to fix and never apologise. Arabic is a first-class setting of the same copy, written by a native writer, not a translation layer; every Arabic string appears in Appendix B with a status.

Five example lines:

1. **Bring us the hard one.**
2. *Documented well enough for your next vendor to read.*
3. *The people who scope your build are the people who ship it, and they stay on for the run.*
4. *Add the part after @ in your email.*
5. *Request sent. We reply within one working day with times.*

---

## 8. Anti-default audit

| Default it could have been | What replaced it |
|---|---|
| Near-black ground + one warm accent (ban #2 in green clothing) | A chromatic, subject-derived ground (flag green pulled into palm shade), emphasis by inversion (two Limestone sections, Limestone CTAs), Aldebaran capped to three non-text roles and policed by its own 1.80:1 failure on Limestone |
| "Heritage tourism": deep green, monumental type, stone, the vocabulary of Saudi cultural institutions | Sentence-case H1 ("Bring us the hard one."), a static mono line of real tools on screen one, a mono readout of the stone's own state (an instrument being computed), tool names in every ledger, ZATCA Phase 2 / UBL XML rather than mood |
| Hero text input that reads as an AI prompt bar | No box, no icon, no pill, no "ask"/"AI" language; a Mist rule in display type under a question about their project; a button that says "Carve it"; a result that is stone; a user-test gate with a defined fallback |
| Five giant words with a detail panel = the hover-accordion services list | State is scroll-bound width, not hover; the stone carves the active word; the words are real buttons; the ledger is tool names in mono; no icons, no 01/02/03 |
| Case-study card grid with logos | A ruled list where every row names the hard part and carries a five-cell weave-mark of which capabilities it used (data, not decoration); no clients, no logos, no images |
| "2,000+ / 4" stat tiles | A sentence, and a need → ship mapping |
| Preloader / progress bar | The carve is the loading state and the readout counts the cells |
| Dark "terminal" surface for process | The run is five numbered steps on the same green, joined by one drawn line, because it is a real sequence |
| Variable-font demo | Exactly two width states (spire 50, slab 150) and a scrub between them; body in Plex Sans Arabic for a bilingual reason |
| 3D that fades in and floats | The stone does nothing until you do; it is lit by the cursor, carved by the input, and it ends by dissolving under noon light |
| Removed on review | A seventh palette colour (slab is a material), idle animation on the stone, a typing effect on the manifest, film grain, bloom, the hero's noon beat (moved to the end of capabilities so the sun never runs backwards), star-name serials, a girih, a sadu band |

Residual honesty: a Plex body on a green ground with generous padding is still a calm reading layer; that is intentional. The boldness is spent on the stone and the type, and the rest stays disciplined so a buyer can read the stack list without fighting the page.

---

## 9. Open risks for engineering

1. **Prompt-bar read.** Gate: three target-buyer tests at 390px and 1440px. Fallback if it fails: the input moves below the fold into the contact section and the hero stone cycles the five placeholder briefs (time-based, 6s each); the readout still counts. Everything else in this spec survives unchanged.
2. **Relief legibility for real briefs.** 96×144 with a 40-char / 3-line cap gives ≈7 cells advance and ≈10 cells cap height; 64×96 with 24 / 2 gives ≈5.3 and ≈7.4. A native reader must check Arabic wrapping and the joined forms at both tiers before launch.
3. **`next/font` axes.** Missing `axes: ["wdth"]` on Anybody or Martian Mono degrades the whole width system to nothing with no error. Add a lint rule or a test that reads `getComputedStyle` of a probe element at wdth 50 vs 150 and asserts a width difference.
4. **Canvas font names.** `ctx.font` must use `font.style.fontFamily`; a dev assertion compares the runtime نبني raster to the committed mask.
5. **Safari canvas `fontStretch`.** Safari rasterises weight-only, so the Latin relief is narrower there. Acceptable; test it.
6. **Width-lens reflow.** Fixed-width `contain: layout paint` wrappers, `quickSetter` on a custom property, ≤2 words animating, range 50–115 below 768px. If a mid-range Android still drops frames, snap wdth per word (no scrub) on Tier B.
7. **Shadow maps on integrated GPUs.** Tier A is desktop only; the watchdog demotes to Tier B after 60 frames over 20ms. Profile on a 2019 integrated-GPU laptop and a mid-range Android before launch.
8. **Fixed canvas + sticky anchor alignment.** `placeSlab(rect)` runs on scroll and resize; verify against Lenis lerp (the DOM rect lags one frame behind the smoothed scroll; read the rect inside the Lenis scroll callback, not rAF).
9. **`SceneCanvas` frameloop.** The wrapper currently overrides the passed `frameloop`; the one-line change in Appendix A is required or the stone will render every frame.
10. **Process and team claims.** "No subcontracting", "stay on for the run", "you own the code, the infra and the docs", "one working day", the ZATCA clause on the commerce row, and `teamFacts.founded` are claims to confirm; ship only true values.
11. **AR mode.** It is a full-page test case (dir, lens, ripple direction, DrawSVG direction, Reem Kufi weight lens, Arabic form validation copy). Ship behind `NEXT_PUBLIC_ENABLE_AR`; keep the toggle hidden until every string in Appendix B is native-reviewed.
12. **Green fatigue.** The two Limestone inversions are load-bearing; do not cut either for length.
13. **Accent creep.** Aldebaran's three-role cap is a rule, not a preference; a fourth use tips the page into festive.
14. **Contact validation vs. the carve.** `project.min` in `contact.ts` must be lowered (Appendix A) or a short carved brief fails on submit.

---

## Appendix A — Scaffold changes, file by file

| File | Change |
|---|---|
| `app/layout.tsx` | Replace Geist/Geist_Mono with the four `next/font` declarations in §3.1; `<html lang="en" dir="ltr">` with the four font variables; wrap in `SmoothScroll`, `DirectionProvider`, `Cursor`, `Toaster`; `<ThemeProvider forcedTheme="light" enableSystem={false}>` (the `d` hotkey becomes a no-op). |
| `app/globals.css` | Replace `:root` / `.dark` with §2.1–2.3; add `.cursor` states (§6.3), `.stele-anchor` sizing, `[data-ground]` on every section root; `html { background: var(--color-palm) }` so overscroll is never white. |
| `lib/motion/gsap.ts` | `import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"` and register it; `ScrollTrigger.config({ ignoreMobileResize: true })`; `CustomEase.create("carve", "M0,0 C0.7,0 0.3,1 1,1")` and `CustomEase.create("lift", "M0,0 C0.25,1 0.5,1 1,1")`. |
| `components/three/scene-canvas.tsx` | `frameloop={running ? (frameloop ?? "always") : "never"}` (destructure `frameloop` from props); allow `gl.antialias` override (already spreads `gl`). |
| `lib/three/raster-bitmask.ts` | New (§4.5). Shares `makeCanvas` with `sample-text.ts`. |
| `lib/stele/bitmaps.ts` | Committed hex-row masks for نبني and WE BUILD at both tiers, produced in the browser by the dev page below. |
| `app/dev/stele-bitmaps/page.tsx` | Dev-only (404 outside `NODE_ENV === "development"`): runs `rasterizeToBitmask` with the real next/font families and prints hex rows to paste into `bitmaps.ts` (§4.5). |
| `lib/design/palette.ts` | `readPalette()` (§2.4). |
| `components/stele/stele-canvas.tsx`, `stele-svg.tsx`, `readout.tsx`, `stele-state.ts`, `use-stele.ts` | New (§4). |
| `components/sections/{nav,hero,capabilities,work,team,kingdom,contact,footer}.tsx` | New (§5). Each section root: `id`, `data-ground`. |
| `components/cursor/cursor.tsx` | Add states `stone`, `input`; write normalised pointer to `steleState` on move. |
| `lib/site.config.ts` | `nav: [Work #work, Capabilities #capabilities, Team #team, Riyadh #kingdom, Contact #contact]`. |
| `content/capabilities.ts` | Add `arShort`, `line`, `ledger` (values in §5.3). |
| `content/projects.ts` | Add `hardPart`, `shippedAs` (values in §5.4); rename the third title to "Headless commerce with ZATCA e-invoicing" pending confirmation. |
| `content/process.ts` | No change; rendered as "The run". |
| `content/team.ts` | No change; `count` is not rendered anywhere. |
| `content/stack.ts`, `content/kingdom.ts` | New (values in §5.5, §5.6). |
| `app/actions/contact.ts` | `project.min(12, "Tell us in a sentence what you want to build.")`; `email` message "Add the part after @ in your email."; `name` message "Enter your name."; form maps Organisation → `company`; `budget` stays optional and unrendered. |
| `app/page.tsx` | Compose the eight sections in order inside `<main id="content">`. |

## Appendix B — Arabic strings register

| String | Transliteration / meaning | Where | Status |
|---|---|---|---|
| نبني | nabni, "we build" | stone on load; readout | verified, secular |
| الرياض | ar-Riyāḍ, "Riyadh" (lit. "the gardens") | kingdom bilingual line | verified |
| عربي | ʿarabī, "Arabic" | nav / footer toggle | verified |
| الويب · الجوال · سطح المكتب · الواجهات · الذكاء | web · mobile · desktop · interfaces · intelligence | capability lens, AR mode | candidates; native review required (single-word display forms, not the long `ar` labels in `capabilities.ts`) |
| أعطونا الأصعب. | aʿṭūnā al-aṣʿab, "give us the hardest" | H1, AR mode | candidate; native copywriter |
| All body, ledger, mapping, form and error copy in AR mode | — | `ar` fields to be added to every content file | to be written by a native writer before `NEXT_PUBLIC_ENABLE_AR` is set |

Rules: Arabic is never character-split (SplitText `type: "lines"` only), never letter-spaced, never `scaleX`ed, always shaped by the font (Reem Kufi display, Plex Sans Arabic body), and the register stays secular: square Kufic was historically used for sacred names and this page never borrows that register.