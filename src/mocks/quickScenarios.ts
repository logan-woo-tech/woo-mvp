export type QuickScenarioId =
  | "unhappy-customer-quick"
  | "ask-more-time-quick"
  | "give-update-quick";

export type QuickScenario = {
  id: QuickScenarioId;
  title: string;
  situation: string;
  prompt: string;
  betterVersion: string;
  primaryFix: string;
  nextScenarioId?: QuickScenarioId;
};

export const QUICK_SCENARIOS: Record<QuickScenarioId, QuickScenario> = {
  "unhappy-customer-quick": {
    id: "unhappy-customer-quick",
    title: "Unhappy customer (quick)",
    situation: "A customer is upset and needs a calm response now.",
    prompt: "How do you acknowledge frustration and move to a solution?",
    betterVersion:
      "I understand this is frustrating. We found the issue and are fixing it now. I will send you an update within one hour.",
    primaryFix: "Show empathy first, then give one clear action and timing.",
    nextScenarioId: "ask-more-time-quick",
  },
  "ask-more-time-quick": {
    id: "ask-more-time-quick",
    title: "Ask for more time (quick)",
    situation: "You cannot meet the current deadline and must ask for extension.",
    prompt: "How do you request more time without sounding uncertain?",
    betterVersion:
      "I need a short extension because I am finalizing the last details. I can deliver the completed version by tomorrow at 4 PM.",
    primaryFix: "Give a concrete new deadline with confident wording.",
    nextScenarioId: "give-update-quick",
  },
  "give-update-quick": {
    id: "give-update-quick",
    title: "Give a clear update (quick)",
    situation: "Stakeholders are waiting and need a concise progress update.",
    prompt: "What update can you give in 1-2 clear sentences?",
    betterVersion:
      "Quick update: testing is in progress and 80% complete. We are on track to finish by end of day and I will confirm once done.",
    primaryFix: "Lead with status first, then one concrete next step.",
    nextScenarioId: "unhappy-customer-quick",
  },
};

export function getQuickScenario(
  scenarioId: string | null | undefined,
): QuickScenario | null {
  if (!scenarioId) return null;
  return QUICK_SCENARIOS[scenarioId as QuickScenarioId] ?? null;
}
