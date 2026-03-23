export type WorkScenarioId = "delay-client";

export type WorkScenario = {
  id: WorkScenarioId;
  title: string;
  shortLabel: string;
  description: string;
  focus: string;
  context: string;
  question: string;
  toneStarters: {
    polite: string;
    neutral: string;
    urgent: string;
  };
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
      polite: "I’d like to update you on the timeline...",
      neutral: "We are slightly behind schedule because...",
      urgent: "To ensure quality, we need to adjust the timeline...",
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
