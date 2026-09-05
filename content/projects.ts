import type { CapabilityId } from "./capabilities"

/**
 * DRAFT portfolio entries.
 * These describe project TYPES the team has shipped, not named clients.
 * Replace `title`, `summary`, `hardPart`, `outcomes` and `year` with real
 * case studies before launch. No client names or logos are used on the site.
 */
export type Project = {
  slug: string
  title: string
  sector: string
  summary: string
  /** What was hard, in one or two sentences. Rendered in the work list. */
  hardPart: string
  /** Which capabilities were used; drives the five-cell weave-mark. */
  capabilities: CapabilityId[]
  stack: string[]
  /** What the client received, e.g. "web app", "iOS + Android". */
  shippedAs: string[]
  outcomes: string[]
  year: string
  /** Seed for procedural artwork, if any. Any stable integer. */
  seed: number
}

export const projects: Project[] = [
  {
    slug: "gold-trading-platform",
    title: "Precious-metals trading platform",
    sector: "Fintech",
    summary:
      "Live gold and silver pricing, wallet ledgers, KYC onboarding and a broker back office. Web app, mobile app and a desktop trading terminal on one API.",
    hardPart:
      "Live gold and silver pricing, a double-entry ledger with a full audit trail, sub-second updates on a trader's desktop.",
    capabilities: ["web", "mobile", "desktop", "api"],
    stack: ["Next.js", "Laravel", "GraphQL", "Flutter", "Electron", "Redis"],
    shippedAs: ["web app", "iOS + Android", "desktop terminal"],
    outcomes: [
      "Sub-second price updates across web, mobile and desktop",
      "Double-entry ledger with full audit trail",
      "Passed third-party security review before launch",
    ],
    year: "2025",
    seed: 11,
  },
  {
    slug: "real-estate-marketplace",
    title: "Real-estate marketplace",
    sector: "PropTech",
    summary:
      "Listings, map search, agent CRM and lead routing for a property marketplace, with Arabic and English interfaces from day one.",
    hardPart:
      "Arabic-first search over 100k+ listings, map search, agent CRM with automated lead routing.",
    capabilities: ["web", "mobile", "api"],
    stack: ["Next.js", "PostgreSQL", "PostGIS", "React Native", "Meilisearch"],
    shippedAs: ["web app", "iOS + Android"],
    outcomes: [
      "Bilingual, RTL-correct interface",
      "Map search over 100k+ listings",
      "Agent CRM with automated lead routing",
    ],
    year: "2025",
    seed: 23,
  },
  {
    slug: "headless-commerce",
    title: "Headless commerce platform",
    sector: "Retail",
    summary:
      "A Medusa-based commerce backend with a custom storefront, order management and local payment and shipping integrations.",
    hardPart:
      "A custom storefront on a Medusa backend, order management for fulfilment teams, local payment gateways and cash on delivery.",
    capabilities: ["web", "api"],
    stack: [
      "Medusa",
      "Next.js",
      "PostgreSQL",
      "Local payment gateways",
      "Local carriers",
    ],
    shippedAs: ["storefront", "ops dashboard"],
    outcomes: [
      "Checkout in under three steps",
      "Local payment gateways and cash on delivery",
      "Ops dashboard for fulfilment teams",
    ],
    year: "2024",
    seed: 37,
  },
  {
    slug: "data-extraction-pipelines",
    title: "Large-scale data extraction",
    sector: "Data",
    summary:
      "Distributed crawlers, proxy rotation, scheduling and normalisation pipelines feeding analytics and pricing models.",
    hardPart:
      "Millions of pages a day with retry and dedupe, schema-validated output, alerts on drift.",
    capabilities: ["web", "api", "ai"],
    stack: ["Python", "Playwright", "Celery", "PostgreSQL", "ClickHouse"],
    shippedAs: ["pipelines", "GraphQL delivery API"],
    outcomes: [
      "Millions of pages per day with retry and dedupe",
      "Structured output validated against schemas",
      "Monitoring with alerting on drift",
    ],
    year: "2024",
    seed: 41,
  },
  {
    slug: "air-quality-monitoring",
    title: "Environmental monitoring dashboard",
    sector: "IoT",
    summary:
      "Sensor ingestion, time-series storage and public dashboards for air-quality data, with alerts and exportable reports.",
    hardPart:
      "Real-time ingestion from distributed sensors, time-series storage, threshold alerts by email and SMS.",
    capabilities: ["web", "api"],
    stack: ["Node.js", "TimescaleDB", "React", "MQTT", "Grafana"],
    shippedAs: ["public dashboards", "alerts"],
    outcomes: [
      "Real-time ingestion from distributed sensors",
      "Public dashboards with historical comparison",
      "Threshold alerts by email and SMS",
    ],
    year: "2023",
    seed: 53,
  },
  {
    slug: "arabic-document-assistant",
    title: "Arabic document intelligence",
    sector: "AI",
    summary:
      "A retrieval-augmented assistant over contracts and regulations, with a fine-tuned Arabic model, evaluation suite and an MCP server for internal tools.",
    hardPart:
      "A fine-tuned Arabic model that beat the base on legal QA, citations on every answer, an MCP server for internal agents.",
    capabilities: ["ai", "api", "web"],
    stack: ["PyTorch", "LoRA", "pgvector", "MCP", "FastAPI", "Next.js"],
    shippedAs: ["assistant", "MCP server"],
    outcomes: [
      "Fine-tuned model outperformed the base on Arabic legal QA",
      "Citations on every answer",
      "MCP server exposed to internal agents",
    ],
    year: "2025",
    seed: 67,
  },
]
