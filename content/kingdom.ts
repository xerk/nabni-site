/**
 * Saudi grounding as a need → ship mapping, not stat tiles.
 */
export const kingdom = {
  latin: "RIYADH",
  arabic: "الرياض",
  prose:
    "Riyadh is the region's fastest-growing startup hub: more than two thousand startups, four unicorns, and a 2030 plan that needs software written for Arabic first, not translated later. We build for the teams working inside that plan, with SDAIA, Monsha'at, NEOM and KAUST programs, and for the regulators they answer to.",
  needsHeading: "What the market needs",
  shipsHeading: "What we ship",
  mapping: [
    {
      need: "ZATCA Phase 2 e-invoicing",
      ship: "UBL XML, QR codes, clearance and reporting integration",
    },
    {
      need: "Arabic-first products",
      ship: "RTL layouts, Arabic search and NLP, Hijri and Gregorian dates",
    },
    {
      need: "Government digital services",
      ship: "accessible portals, identity and payment integrations, bilingual parity",
    },
    {
      need: "Data that stays in-Kingdom",
      ship: "on-prem or in-region RAG and fine-tuning on your infrastructure",
    },
    {
      need: "Fintech and logistics at scale",
      ship: "real-time ledgers, fleet telemetry, audit trails",
    },
  ],
} as const
