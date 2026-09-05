/**
 * Visual QA harness. Requires a running server (dev or start).
 *
 *   node scripts/screenshots.mjs http://localhost:3000 out-dir
 *
 * Captures: full page at 1440×900 and 390×844, every section at both sizes,
 * a reduced-motion run, and a hero scroll sequence at 1440. Also collects
 * console errors/warnings and failed requests into <out-dir>/console.json.
 */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const base = process.argv[2] ?? "http://localhost:3000"
const out = process.argv[3] ?? "screenshots"
await mkdir(out, { recursive: true })

const SECTIONS = ["hero", "capabilities", "work", "team", "kingdom", "contact"]
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, pointer: "fine" },
  { name: "mobile", width: 390, height: 844, pointer: "coarse" },
]

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] })
const log = []

async function settle(page, ms = 600) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.waitForTimeout(ms)
}

async function run({ name, width, height, pointer }, { reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion,
    hasTouch: pointer === "coarse",
    isMobile: pointer === "coarse",
  })
  const page = await context.newPage()
  const tag = reducedMotion === "reduce" ? `${name}-rm` : name
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) log.push({ tag, type: m.type(), text: m.text() })
  })
  page.on("pageerror", (e) => log.push({ tag, type: "pageerror", text: String(e) }))
  page.on("requestfailed", (r) => log.push({ tag, type: "requestfailed", text: r.url() }))

  await page.goto(base, { waitUntil: "networkidle" })
  await page.waitForTimeout(4500) // load sequence (+ software GL compile)
  await page.screenshot({ path: path.join(out, `${tag}-00-top.png`) })

  if (reducedMotion !== "reduce") {
    // Hero scroll sequence (desktop pin)
    for (const p of [0.25, 0.5, 0.75, 1.0]) {
      await page.evaluate((frac) => window.scrollTo(0, Math.round(window.innerHeight * 2 * frac)), p)
      await settle(page, 900)
      await page.screenshot({ path: path.join(out, `${tag}-01-hero-${Math.round(p * 100)}.png`) })
    }
  }

  for (const id of SECTIONS) {
    const el = await page.$(`#${id}`)
    if (!el) {
      log.push({ tag, type: "missing-section", text: id })
      continue
    }
    await page.evaluate((sid) => {
      const node = document.getElementById(sid)
      node?.scrollIntoView({ block: "start", behavior: "instant" })
    }, id)
    await settle(page, 1200)
    await page.screenshot({ path: path.join(out, `${tag}-10-${id}.png`) })
    // Mid-section view (the interesting part of tall sections)
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.9)))
    await settle(page, 900)
    await page.screenshot({ path: path.join(out, `${tag}-11-${id}-mid.png`) })
  }

  await page.screenshot({ path: path.join(out, `${tag}-99-full.png`), fullPage: true })
  await context.close()
}

for (const vp of VIEWPORTS) await run(vp)
await run(VIEWPORTS[0], { reducedMotion: "reduce" })

await writeFile(path.join(out, "console.json"), JSON.stringify(log, null, 2))
await browser.close()
console.log(`done: ${out} (${log.length} console entries)`)
