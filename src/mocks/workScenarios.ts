export type WorkScenarioTone = "formal" | "neutral" | "friendly";
export type WorkScenarioId = "delay-client" | "unhappy-customer";

export type WorkScenario = {
  id: WorkScenarioId;
  title: string;
  shortLabel: string;
  description: string;
  focus: string;
  context: string;
  question: string;
  toneStarters: Record<WorkScenarioTone, string>;
  helpfulWords: string[];
  starterSentences: string[];
  sampleAnswer: string;
};

export const WORK_SCENARIOS: Record<WorkScenarioId, WorkScenario> = {
  "delay-client": {
    id: "delay-client",
    title: "Explain a delay to a client",
    shortLabel: "Explain a delay",
    description: "Communicate delays clearly without losing trust.",
    focus: "Be clear, take responsibility, and propose a solution.",
    context:
      "You promised a deadline, but your team is behind. You need to inform the client without losing trust.",
    question: "How would you explain the delay and keep the client's trust?",
    toneStarters: {
      formal: "I’d like to update you on the timeline...",
      neutral: "We are slightly behind schedule because...",
      friendly: "Quick update — we’re a bit behind because...",
    },
    helpfulWords: [
      "delay",
      "timeline",
      "issue",
      "adjust",
      "deliver",
      "quality",
      "update",
    ],
    starterSentences: [
      "We are slightly behind because...",
      "The current situation is...",
      "To ensure quality, we will...",
    ],
    sampleAnswer:
      "We are slightly behind schedule because we found an issue during testing. For example, one key function did not perform as expected. To ensure quality, we suggest extending the timeline by two days and will keep you updated daily.",
  },
  "unhappy-customer": {
    id: "unhappy-customer",
    title: "Handle an unhappy customer",
    shortLabel: "Handle an unhappy customer",
    description: "Respond calmly and resolve customer frustration.",
    focus: "Acknowledge emotion, take responsibility, and move to solution.",
    context:
      "A customer is unhappy about your service or delay. You need to respond without making the situation worse.",
    question:
      "How would you respond to calm the customer and move toward a solution?",
    toneStarters: {
      formal: "I understand your concern and appreciate you bringing this up...",
      neutral: "I understand the issue and we are looking into it...",
      friendly: "I get why this is frustrating — let me help fix it...",
    },
    helpfulWords: [
      "understand",
      "concern",
      "frustrating",
      "resolve",
      "support",
      "fix",
      "update",
    ],
    starterSentences: [
      "I understand how you feel because...",
      "The issue happened because...",
      "We are fixing this by...",
    ],
    sampleAnswer:
      "I understand how frustrating this must be because the delay affected your plan. For example, your order did not arrive on time. We are fixing this now and will update you within the next hour.",
  },
};

export function getWorkScenario(
  scenarioId: string | null | undefined,
): WorkScenario | null {
  if (!scenarioId) return null;
  return WORK_SCENARIOS[scenarioId as WorkScenarioId] ?? null;
}
