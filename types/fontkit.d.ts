/**
 * fontkit ships no type declarations for its browser build. Only the two
 * calls the glass word makes are declared; the shaped result is described
 * structurally in lib/glass/shape.ts.
 */
declare module "fontkit" {
  export function create(buffer: Uint8Array): {
    getVariation(settings: Record<string, number>): unknown
  }
  const fontkit: {
    create: typeof create
  }
  export default fontkit
}
