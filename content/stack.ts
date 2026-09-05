/**
 * The manifest: the real stack, in the register an engineer trusts.
 * Rendered as mono key/value rows in the team section.
 */
export type StackRow = { key: string; value: string }

export const stack: StackRow[] = [
  { key: "frontend", value: "next.js · react 19 · tailwind · three.js · gsap" },
  { key: "backend", value: "django · fastapi · laravel · node" },
  { key: "mobile", value: "flutter · react native · swift · kotlin" },
  { key: "desktop", value: "electron" },
  { key: "api", value: "graphql (apollo) · rest · openapi docs" },
  {
    key: "data",
    value: "postgresql · redis · pgvector · clickhouse · timescaledb",
  },
  { key: "ai", value: "pytorch · lora · vllm · mcp sdk · evals" },
  {
    key: "infra",
    value:
      "aws · docker · kubernetes · terraform · github actions · in-Kingdom regions",
  },
]

/** Static tool line under the hero input. */
export const heroToolLine =
  "Next.js · Django · Laravel · Flutter · React Native · Electron · GraphQL · vLLM · MCP"
