export type WorkScenarioTone = "formal" | "neutral" | "friendly";
export type WorkScenarioId = "delay-client";

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
};

export function getWorkScenario(
  scenarioId: string | null | undefined,
): WorkScenario | null {
  if (!scenarioId) return null;
  return WORK_SCENARIOS[scenarioId as WorkScenarioId] ?? null;
}
