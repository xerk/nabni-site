"use client"

/**
 * next/font renames families (e.g. `'__Anybody_a1b2c3'`), so a literal
 * "Anybody" in `ctx.font` silently falls back to the system font. The real
 * family stacks live in CSS variables set on <html> by app/layout.tsx.
 */
export type FontVar =
  | "--font-anybody"
  | "--font-reem-kufi"
  | "--font-plex-arabic"
  | "--font-martian"

const cache = new Map<FontVar, string>()

/** Returns the resolved family stack for a font variable, e.g. `'__Anybody_x', '__Anybody_Fallback_x'`. */
export function getFontFamily(variable: FontVar): string {
  const hit = cache.get(variable)
  if (hit) return hit
  if (typeof document === "undefined") return ""
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
  if (value) cache.set(variable, value)
  return value
}

/** The first family in the stack, quoted for use inside `ctx.font`. */
export function getPrimaryFamily(variable: FontVar): string {
  const stack = getFontFamily(variable)
  const first = stack.split(",")[0]?.trim() ?? ""
  return first.startsWith("'") || first.startsWith('"') ? first : `'${first}'`
}

/**
 * Resolve when the face can draw on canvas. Call before any rasterisation.
 * `document.fonts.load` needs a concrete font shorthand and sample text.
 */
export async function loadFontForCanvas(
  variable: FontVar,
  weight: number | string,
  sample: string
): Promise<string> {
  const family = getPrimaryFamily(variable)
  if (!family || typeof document === "undefined" || !("fonts" in document))
    return family
  try {
    await document.fonts.load(`${weight} 64px ${family}`, sample)
    await document.fonts.ready
  } catch {
    // The fallback face still produces a usable shape.
  }
  return family
}
