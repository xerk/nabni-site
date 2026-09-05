/**
 * The delivery process. This IS a sequence, so step numbers carry meaning.
 */
export type ProcessStep = {
  step: number
  title: string
  duration: string
  description: string
  outputs: string[]
}

export const process: ProcessStep[] = [
  {
    step: 1,
    title: "Discover",
    duration: "1 to 2 weeks",
    description:
      "We map the problem, the users and the systems already in place. You get a scoped plan with a fixed price for the next phase.",
    outputs: [
      "Scope and success metrics",
      "Architecture options",
      "Fixed-price proposal",
    ],
  },
  {
    step: 2,
    title: "Design and architect",
    duration: "2 to 3 weeks",
    description:
      "Interface design and technical architecture in parallel. Every screen and every service is agreed before a sprint starts.",
    outputs: [
      "Clickable prototype",
      "System design",
      "Data model and API contracts",
    ],
  },
  {
    step: 3,
    title: "Build in sprints",
    duration: "2-week sprints",
    description:
      "A senior team ships working software every two weeks to a staging environment you can open. No demos on slides.",
    outputs: [
      "Staging release every sprint",
      "Automated tests",
      "Written sprint notes",
    ],
  },
  {
    step: 4,
    title: "Launch",
    duration: "1 week",
    description:
      "Security review, load testing, store submissions and go-live with a rollback plan. We are on call for launch week.",
    outputs: ["Production deployment", "Runbooks", "Monitoring and alerts"],
  },
  {
    step: 5,
    title: "Run and hand over",
    duration: "Ongoing",
    description:
      "Either we keep operating it, or we train your team and hand over clean code with documentation. Both are normal.",
    outputs: ["Documentation", "Team training", "Support agreement"],
  },
]
