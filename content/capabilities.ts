export type CapabilityId = "web" | "mobile" | "desktop" | "api" | "ai"

export type Capability = {
  id: CapabilityId
  /** The word the stone carves and the width lens shows (caps). */
  word: string
  /** Single-word Arabic display form for the lens in AR mode (native review required). */
  arShort: string
  title: string
  /** Two or three words for compact labels and nav. */
  short: string
  /** Longer Arabic label. */
  ar: string
  /** One sentence shown in the lens ledger. */
  line: string
  /** Tool names shown in the ledger, mono. */
  ledger: string
  description: string
  stack: string[]
  /** What clients actually receive. */
  deliverables: string[]
}

/** Fixed order; also the order of the five weave-mark cells. */
export const capabilities: Capability[] = [
  {
    id: "web",
    word: "WEB",
    arShort: "الويب",
    title: "Full-stack web",
    short: "Web platforms",
    ar: "منصات الويب",
    line: "Frontend and backend, one team.",
    ledger:
      "Python (Django, FastAPI) · PHP (Laravel) · TypeScript (Next.js, Node)",
    description:
      "Customer portals, marketplaces and internal tools built end to end. TypeScript on the front, Python or PHP on the back, whichever your team can own after handover.",
    stack: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Python",
      "FastAPI",
      "Django",
      "PHP",
      "Laravel",
      "PostgreSQL",
      "MySQL",
      "Redis",
    ],
    deliverables: [
      "Customer portals",
      "Marketplaces",
      "Internal tools",
      "Admin dashboards",
      "Payment and ZATCA e-invoicing integration",
    ],
  },
  {
    id: "mobile",
    word: "MOBILE",
    arShort: "الجوال",
    title: "Mobile apps",
    short: "iOS & Android",
    ar: "تطبيقات الجوال",
    line: "One codebase, both stores, RTL from day one.",
    ledger: "Flutter · React Native",
    description:
      "One codebase, both stores. Flutter when pixel-level control matters, React Native when you already run a React team. Native modules where the platform demands it.",
    stack: [
      "Flutter",
      "Dart",
      "React Native",
      "Expo",
      "Swift",
      "Kotlin",
      "Firebase",
      "App Store & Play release",
    ],
    deliverables: [
      "Consumer apps",
      "Field and operations apps",
      "Offline-first sync",
      "Push, deep links, in-app payments",
    ],
  },
  {
    id: "desktop",
    word: "DESKTOP",
    arShort: "سطح المكتب",
    title: "Desktop applications",
    short: "Desktop",
    ar: "تطبيقات سطح المكتب",
    line: "Windows and macOS apps wired to your backend.",
    ledger: "Electron",
    description:
      "Electron apps for Windows, macOS and Linux that feel native: local databases, hardware access, auto-updates and signed installers.",
    stack: [
      "Electron",
      "React",
      "Node.js",
      "SQLite",
      "Native addons",
      "Auto-update",
      "Code signing",
    ],
    deliverables: [
      "Point-of-sale and kiosk software",
      "Trading and monitoring terminals",
      "Internal desktop tools",
    ],
  },
  {
    id: "api",
    word: "API",
    arShort: "الواجهات",
    title: "APIs and documentation",
    short: "GraphQL & docs",
    ar: "الواجهات البرمجية",
    line: "Documented well enough for your next vendor to read.",
    ledger: "GraphQL · REST · schema-first documentation",
    description:
      "GraphQL and REST APIs designed as products: typed schemas, versioning, rate limits, and documentation your partners can integrate from without a call.",
    stack: [
      "GraphQL",
      "Apollo",
      "REST",
      "OpenAPI",
      "Webhooks",
      "OAuth 2.0",
      "Docs portals",
      "SDK generation",
    ],
    deliverables: [
      "Partner and public APIs",
      "Backend-for-frontend layers",
      "Developer portals",
      "Migration from legacy services",
    ],
  },
  {
    id: "ai",
    word: "AI",
    arShort: "الذكاء",
    title: "AI engineering",
    short: "LLM, RAG & MCP",
    ar: "هندسة الذكاء الاصطناعي",
    line: "Arabic-capable models on your data, on your infrastructure.",
    ledger: "LLM fine-tuning · RAG pipelines · MCP servers · agents",
    description:
      "Fine-tuned models, retrieval pipelines and agents that hold up in production, including Arabic-first use cases. We measure before we ship.",
    stack: [
      "LLM fine-tuning",
      "LoRA / QLoRA",
      "RAG",
      "Vector databases",
      "MCP servers",
      "Agents and tool use",
      "Evals",
      "Arabic NLP",
      "PyTorch",
    ],
    deliverables: [
      "Domain assistants on your data",
      "Document intelligence",
      "MCP servers for your systems",
      "Model fine-tuning and evaluation",
    ],
  },
]

export const capabilityIds: CapabilityId[] = capabilities.map((c) => c.id)
