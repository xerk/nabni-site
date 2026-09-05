/**
 * The team is described by roles, not names. No invented people.
 * Update `count` values to real numbers before launch.
 */
export type TeamRole = {
  id: string
  role: string
  ar: string
  count: number
  focus: string
  tools: string[]
}

export const team: TeamRole[] = [
  {
    id: "backend",
    role: "Backend engineers",
    ar: "مهندسو الخلفية",
    count: 6,
    focus: "Python, PHP and Node services, data modelling, integrations",
    tools: ["Python", "Laravel", "Node.js", "PostgreSQL", "Redis"],
  },
  {
    id: "frontend",
    role: "Frontend engineers",
    ar: "مهندسو الواجهات",
    count: 5,
    focus: "React and Next.js products, design systems, motion and 3D",
    tools: ["TypeScript", "React", "Next.js", "Three.js", "GSAP"],
  },
  {
    id: "mobile",
    role: "Mobile engineers",
    ar: "مهندسو الجوال",
    count: 4,
    focus: "Flutter and React Native apps, store releases, native modules",
    tools: ["Flutter", "React Native", "Swift", "Kotlin"],
  },
  {
    id: "ai",
    role: "AI engineers",
    ar: "مهندسو الذكاء الاصطناعي",
    count: 3,
    focus: "Fine-tuning, retrieval, agents, evaluation, Arabic NLP",
    tools: ["PyTorch", "LoRA", "pgvector", "MCP", "Evals"],
  },
  {
    id: "platform",
    role: "Platform and DevOps",
    ar: "البنية التحتية",
    count: 2,
    focus: "Cloud, CI/CD, observability, security reviews",
    tools: ["AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions"],
  },
  {
    id: "design",
    role: "Product designers",
    ar: "مصممو المنتجات",
    count: 2,
    focus: "Research, interface design, prototyping, bilingual UI",
    tools: ["Figma", "Prototyping", "Design systems"],
  },
]

export const teamFacts = {
  founded: "2021",
  base: "Riyadh",
  timezone: "Asia/Riyadh (UTC+3)",
  languages: ["Arabic", "English"],
  engagement: ["Fixed-scope projects", "Dedicated teams", "Retainers"],
}
