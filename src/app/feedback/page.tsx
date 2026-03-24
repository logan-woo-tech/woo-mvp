"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getWorkScenario,
  type WorkScenarioId,
  type WorkScenarioTone,
} from "../../mocks/workScenarios";

const VOICE_STORAGE_KEY = "woo_voice_practice_v1";

const ACTIVITY_FEEDBACK: Record<string, string> = {
  "Inner Work":
    "You met yourself gently and told the truth about what you feel.",
  Thinking: "You organized your thought clearly and supported it with reason.",
  "Free Talk":
    "You let your voice move freely, and that openness created breathing room.",
  Mentor:
    "You chose direction with confidence and defined a concrete next move.",
};

const ACTIVITY_SUPPORT: Record<string, string> = {
  "Inner Work": "Hold this warmth as you take your next step.",
  Thinking: "Keep this structure - it will make your next decisions easier.",
  "Free Talk": "Stay open; your clarity will keep unfolding.",
  Mentor: "Now follow through with steady action.",
};

const ACTIVITY_ICON: Record<string, string> = {
  "Inner Work": "🫶",
  Thinking: "🧠",
  "Free Talk": "💬",
  Mentor: "🧭",
};

const ACTIVITY_ACCENT: Record<string, string> = {
  "Inner Work": "text-rose-200",
  Thinking: "text-sky-200",
  "Free Talk": "text-emerald-200",
  Mentor: "text-amber-200",
};

const WORK_SCENARIO_META: Record<
  WorkScenarioId,
  {
    intro: string;
    support: string;
    nextStepLabel: string;
    nextStepScenarioId?: WorkScenarioId;
  }
> = {
  "delay-client": {
    intro: "You explained the delay clearly and kept the message professional.",
    support: "Keep the tone calm, specific, and solution-oriented.",
    nextStepLabel: "Handle an unhappy customer",
    nextStepScenarioId: "unhappy-customer",
  },
  "unhappy-customer": {
    intro: "You acknowledged the customer's frustration and responded professionally.",
    support: "Lead with empathy, then move clearly to a solution.",
    nextStepLabel: "Ask for more time professionally",
    nextStepScenarioId: "ask-more-time",
  },
  "ask-more-time": {
    intro: "You communicated the delay clearly without sounding uncertain.",
    support: "Be specific with your new deadline and show control of the situation.",
    nextStepLabel: "Explain a delay to a client",
    nextStepScenarioId: "delay-client",
  },
};

function getAnswerAwareFeedback(answer: string): string[] {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();
  const lines: string[] = [];

  if (trimmed.length >= 120) {
    lines.push("You stayed with your idea and gave it more depth.");
  }

  if (normalized.includes("because")) {
    lines.push("Strong reasoning - you explained your why clearly.");
  }

  if (normalized.includes("for example") || normalized.includes("example")) {
    lines.push("Your example makes your point easier to trust.");
  }

  if (lines.length === 0 && trimmed.length > 0) {
    lines.push("Clear starting point - now make it a little more concrete.");
  }

  return lines.slice(0, 2);
}

function getPracticalNextLine(answer: string): string {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized.includes("because")) {
    return 'Try this next time: add one "because" sentence to explain your reason.';
  }

  if (!normalized.includes("for example") && !normalized.includes("example")) {
    return "Try this next time: add one real example to increase trust.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Try this next time: stay with your answer a little longer and add one more detail.";
  }

  return "Try this next time: replace a general word with a more precise professional phrase.";
}

function getWhatToChange(
  answer: string,
  scenarioId?: WorkScenarioId | null,
): string {
  if (scenarioId === "delay-client") {
    return "Make your new timeline more specific.";
  }

  if (scenarioId === "unhappy-customer") {
    return "Focus more on empathy before explaining the issue.";
  }

  if (scenarioId === "ask-more-time") {
    return "Make your deadline more precise and confident.";
  }

  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized.includes("because")) {
    return 'Add one clear reason with "because".';
  }

  if (!normalized.includes("for example") && !normalized.includes("example")) {
    return "Add one short example to increase credibility.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Add one more sentence so the client understands both the issue and the next step.";
  }

  return "Tighten one phrase so your main point lands faster.";
}

function getStructureStarter(scenarioId?: WorkScenarioId | null): string {
  if (scenarioId === "delay-client") {
    return "Explain the reason first";
  }

  if (scenarioId === "unhappy-customer") {
    return "Show empathy first";
  }

  if (scenarioId === "ask-more-time") {
    return "Give a clear new deadline";
  }

  return "Start with one clear point";
}

type StructureItem = {
  label: string;
  status: "done" | "missing";
};

function getStructureChecklist(
  answer: string,
  scenarioId?: string,
): StructureItem[] {
  const normalized = answer.toLowerCase();
  const hasDigit = /\d/.test(answer);
  const hasTimelineHint =
    hasDigit ||
    normalized.includes("pm") ||
    normalized.includes("am") ||
    normalized.includes("tomorrow");

  if (scenarioId === "delay-client") {
    return [
      { label: "Acknowledge the issue", status: "done" },
      {
        label: "Explain the reason",
        status: normalized.includes("because") ? "done" : "missing",
      },
      {
        label: "Give a clear timeline",
        status: hasTimelineHint ? "done" : "missing",
      },
      {
        label: "Reassure the client",
        status:
          normalized.includes("update") ||
          normalized.includes("fix") ||
          normalized.includes("ensure")
            ? "done"
            : "missing",
      },
    ];
  }

  if (scenarioId === "unhappy-customer") {
    return [
      {
        label: "Show empathy",
        status:
          normalized.includes("understand") ||
          normalized.includes("sorry") ||
          normalized.includes("frustrating")
            ? "done"
            : "missing",
      },
      {
        label: "Take responsibility",
        status: normalized.includes("we") ? "done" : "missing",
      },
      {
        label: "Offer a solution",
        status:
          normalized.includes("fix") || normalized.includes("resolve")
            ? "done"
            : "missing",
      },
      {
        label: "Give a follow-up",
        status:
          normalized.includes("update") || normalized.includes("soon")
            ? "done"
            : "missing",
      },
    ];
  }

  if (scenarioId === "ask-more-time") {
    const weakConfidence =
      /\bmaybe\b/.test(normalized) ||
      /\btry\b/.test(normalized) ||
      /\bhopefully\b/.test(normalized);

    return [
      { label: "Set the context", status: "done" },
      {
        label: "Explain why",
        status: normalized.includes("because") ? "done" : "missing",
      },
      {
        label: "Give a specific deadline",
        status: hasTimelineHint ? "done" : "missing",
      },
      {
        label: "Sound confident",
        status: weakConfidence ? "missing" : "done",
      },
    ];
  }

  return [];
}

function getWhyThisWorks(scenarioId?: string): string {
  if (scenarioId === "delay-client") {
    return "You moved from apology to clarity and control. This builds trust instead of uncertainty.";
  }

  if (scenarioId === "unhappy-customer") {
    return "You acknowledged emotion first, which reduces tension. Then you moved to solution, which restores trust.";
  }

  if (scenarioId === "ask-more-time") {
    return "You replaced a vague promise with a clear commitment. This makes your message more reliable.";
  }

  return "";
}

function getRiskyPhrases(
  answer: string,
  scenarioId?: string | null,
): Array<{
  phrase: string;
  why: string;
  better: string;
}> {
  const normalized = answer.toLowerCase();
  const matches: Array<{
    phrase: string;
    why: string;
    better: string;
  }> = [];

  const generalRules = [
    {
      phrase: "as soon as possible",
      why: "This sounds vague and does not create confidence.",
      better: "Use a specific deadline like 'by tomorrow at 4 PM'.",
    },
    {
      phrase: "try my best",
      why: "This sounds weak and uncertain.",
      better:
        "Use a clear commitment like 'I will send the updated version by...'.",
    },
    {
      phrase: "maybe",
      why: "This can make your message sound unsure.",
      better: "Use a more confident phrase with a clear next step.",
    },
    {
      phrase: "hopefully",
      why: "This can sound passive in professional updates.",
      better: "State what you will do and when.",
    },
  ] as const;

  const unhappyCustomerRules = [
    {
      phrase: "calm down",
      why: "This can sound dismissive when the customer is upset.",
      better:
        "Acknowledge the frustration instead, e.g. 'I understand why this is frustrating.'",
    },
    {
      phrase: "you misunderstood",
      why: "This can sound defensive and escalate tension.",
      better: "Clarify the issue calmly without blaming the customer.",
    },
    {
      phrase: "it's not our fault",
      why: "This can increase conflict and reduce trust.",
      better: "Focus on what you can do next to resolve the issue.",
    },
    {
      phrase: "please be patient",
      why: "This can feel passive if you do not give a clear action or timeline.",
      better: "Pair it with a specific action and timing.",
    },
  ] as const;

  const rules =
    scenarioId === "unhappy-customer"
      ? [...generalRules, ...unhappyCustomerRules]
      : [...generalRules];

  for (const rule of rules) {
    if (normalized.includes(rule.phrase)) {
      matches.push({
        phrase: rule.phrase,
        why: rule.why,
        better: rule.better,
      });
    }

    if (matches.length >= 3) {
      break;
    }
  }

  return matches;
}

function buildScenarioBetterVersion(
  scenarioId: WorkScenarioId,
  tone: WorkScenarioTone,
): string {
  if (scenarioId === "ask-more-time") {
    if (tone === "formal") {
      return "I would like to request a short extension on the deadline because I am finalizing the last details. To ensure quality, I can deliver the completed version by tomorrow at 4 PM.";
    }

    if (tone === "neutral") {
      return "I need a bit more time because I am finalizing the last details. I can deliver the completed version by tomorrow at 4 PM.";
    }

    return "Quick update — I may need a bit more time because I’m finishing the last details. I can send it by tomorrow at 4 PM.";
  }

  if (scenarioId === "unhappy-customer") {
    if (tone === "formal") {
      return "I understand your concern and appreciate you bringing this up. This happened because of a delay in our process. We are resolving it now and will update you shortly.";
    }

    if (tone === "neutral") {
      return "I understand the issue and why this is frustrating. This happened because of a delay on our side. We are fixing it now and will update you soon.";
    }

    return "I get why this is frustrating — this happened because we had a delay. We are fixing it now and will keep you posted.";
  }

  if (scenarioId === "delay-client") {
    if (tone === "formal") {
      return "I’d like to update you that we are slightly behind schedule because we identified an issue during testing. To ensure quality, we are fixing it now and will provide an update shortly.";
    }

    if (tone === "neutral") {
      return "We are slightly behind schedule because we identified an issue during testing. We are fixing it now and will provide an update shortly.";
    }

    return "Quick update — we’re a bit behind because we found an issue during testing. We’re fixing it now and will keep you posted shortly.";
  }

  return "We are sharing a clear update and will keep you informed.";
}

function speakText(text: string, rate = 0.95, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  window.speechSynthesis.speak(utterance);
}

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Ignore clipboard errors for now
  }
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenarioIdParam = searchParams.get("scenario");
  const scenario = getWorkScenario(scenarioIdParam);
  const isScenarioMode = Boolean(scenario);

  const activityParam = searchParams.get("activity");
  const activity = isScenarioMode ? null : (activityParam ?? "Inner Work");

  const tone =
    (searchParams.get("tone") as WorkScenarioTone | null) ?? "formal";

  const answer = searchParams.get("answer") ?? "";
  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;

  const scenarioMeta = scenario ? WORK_SCENARIO_META[scenario.id] : null;

  const feedbackMessage =
    isScenarioMode && scenarioMeta
      ? scenarioMeta.intro
      : (ACTIVITY_FEEDBACK[activity ?? "Inner Work"] ??
        "You showed up with intention today. Keep this momentum going.");

  const supportMessage =
    isScenarioMode && scenarioMeta
      ? scenarioMeta.support
      : (ACTIVITY_SUPPORT[activity ?? "Inner Work"] ??
        "Keep moving with steady intention, one meaningful step at a time.");

  const activityIcon = isScenarioMode
    ? "🧭"
    : (ACTIVITY_ICON[activity ?? "Inner Work"] ?? "✨");

  const activityAccent = isScenarioMode
    ? "text-amber-200"
    : (ACTIVITY_ACCENT[activity ?? "Inner Work"] ?? "text-neutral-300");

  const answerAwareLines = getAnswerAwareFeedback(answer);
  const practicalNextLine = getPracticalNextLine(answer);
  const whatToChange = getWhatToChange(answer, scenario?.id);
  const structureChecklist = getStructureChecklist(answer, scenario?.id);
  const structureDoneCount = structureChecklist.filter(
    (item) => item.status === "done",
  ).length;
  const structureTotalCount = structureChecklist.length;
  const structureSummaryLine =
    structureTotalCount > 0 && structureDoneCount === structureTotalCount
      ? "Your reply already includes the key parts."
      : structureTotalCount > 0
        ? `${structureDoneCount} of ${structureTotalCount} parts are already strong.`
        : "";
  const riskyPhrases = getRiskyPhrases(answer, scenario?.id);
  const whyThisWorks = getWhyThisWorks(scenario?.id);

  const betterVersion =
    isScenarioMode && scenario
      ? buildScenarioBetterVersion(scenario.id, tone)
      : "";

  const [voiceRecordingUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(VOICE_STORAGE_KEY);
  });
  const [showRepeatPrompt, setShowRepeatPrompt] = useState(false);
  const [showCloserMessage, setShowCloserMessage] = useState(false);
  const [showStructureDetails, setShowStructureDetails] = useState(false);
  const [showWhyThisWorks, setShowWhyThisWorks] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const yourRecordingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(VOICE_STORAGE_KEY);
  }, []);

  const reflectionSummary = answerAwareLines[0] ?? feedbackMessage;
  const nextScenario = scenarioMeta?.nextStepScenarioId
    ? getWorkScenario(scenarioMeta.nextStepScenarioId)
    : null;
  const nextScenarioGoal = nextScenario?.focus ?? "";
  function handleBackToTree() {
    const nextGrowth = growthCount + 1;

    if (isScenarioMode) {
      router.push(
        `/learner?growth=${nextGrowth}&well=${encodeURIComponent(reflectionSummary)}`,
      );
      return;
    }

    const last =
      activity === "Inner Work"
        ? "inner-work"
        : activity === "Thinking"
          ? "thinking"
          : activity === "Free Talk"
            ? "free-talk"
            : "mentor";

    router.push(
      `/learner?growth=${nextGrowth}&last=${last}&well=${encodeURIComponent(reflectionSummary)}`,
    );
  }

  function handleNextChallenge() {
    const nextGrowth = growthCount + 1;
    if (isScenarioMode && scenarioMeta?.nextStepScenarioId) {
      router.push(
        `/conversation?scenario=${encodeURIComponent(scenarioMeta.nextStepScenarioId)}&growth=${nextGrowth}&well=${encodeURIComponent(reflectionSummary)}`,
      );
      return;
    }
    handleBackToTree();
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6">
        <p className={`text-xs ${activityAccent}`}>
          Completed: {activityIcon}{" "}
          {isScenarioMode && scenario
            ? scenario.shortLabel
            : (activity ?? "Inner Work")}
        </p>

        <h1 className="text-lg text-neutral-100">Feedback</h1>
        <p className="text-sm font-medium text-neutral-100">Growth +1</p>

        <p className="text-sm text-neutral-300">{feedbackMessage}</p>

        {answerAwareLines.length > 0 ? (
          <div className="flex flex-col gap-1">
            {answerAwareLines.map((line) => (
              <p key={line} className="text-sm text-neutral-300">
                {line}
              </p>
            ))}
          </div>
        ) : null}

        <p className="text-sm text-neutral-300">{practicalNextLine}</p>

        {!isScenarioMode && voiceRecordingUrl ? (
          <div
            ref={yourRecordingRef}
            className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3"
          >
            <p className="text-xs text-neutral-400">Your recording</p>
            <audio
              ref={voiceAudioRef}
              src={voiceRecordingUrl}
              preload="auto"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => void voiceAudioRef.current?.play()}
              className="mt-2 rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
            >
              ▶️ Play
            </button>
            <p className="mt-2 text-xs text-neutral-400">
              Which one sounds more confident — yours or this version?
            </p>
            <p className="text-xs text-neutral-400">
              Now try saying this version out loud.
            </p>
          </div>
        ) : null}

        {isScenarioMode ? (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-100">Primary fix:</span>{" "}
              {whatToChange}
            </p>

            {structureChecklist.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
                <p className="text-sm text-neutral-100">
                  What a strong reply needs
                </p>
                <p className="text-xs text-neutral-400">Start with one:</p>
                <p className="text-xs text-neutral-400">
                  {getStructureStarter(scenario?.id)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowStructureDetails((prev) => !prev)}
                  className="w-fit rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  {showStructureDetails ? "Hide details" : "Show details"}
                </button>
                {showStructureDetails ? (
                  <>
                    {structureSummaryLine ? (
                      <p className="text-xs text-neutral-400">
                        {structureSummaryLine}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-1.5">
                      {structureChecklist.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                            item.status === "done"
                              ? "border-emerald-800/60 bg-emerald-950/20 text-emerald-200"
                              : "border-amber-800/60 bg-amber-950/20 text-amber-200"
                          }`}
                        >
                          <span className="shrink-0" aria-hidden="true">
                            {item.status === "done" ? "✓" : "○"}
                          </span>
                          <span className="min-w-0 flex-1">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400">
                      Use the missing parts to improve your next draft.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {isScenarioMode && riskyPhrases.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
                <p className="text-sm text-neutral-100">Risky phrase detected</p>

                {riskyPhrases.map((item) => (
                  <div key={item.phrase} className="flex flex-col gap-1">
                    <p className="text-sm text-neutral-300">
                      <span className="text-neutral-100">
                        &quot;{item.phrase}&quot;
                      </span>{" "}
                      — {item.why}
                    </p>
                    <p className="text-sm text-neutral-300">
                      <span className="text-neutral-100">Better:</span>{" "}
                      {item.better}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {voiceRecordingUrl ? (
              <div
                ref={yourRecordingRef}
                className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3"
              >
                <p className="text-xs text-neutral-400">Your recording</p>
                <audio
                  ref={voiceAudioRef}
                  src={voiceRecordingUrl}
                  preload="auto"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => void voiceAudioRef.current?.play()}
                  className="mt-2 rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  ▶️ Play
                </button>
                <p className="mt-2 text-xs text-neutral-400">
                  Which one sounds more confident — yours or this version?
                </p>
                <p className="text-xs text-neutral-400">
                  Now try saying this version out loud.
                </p>
              </div>
            ) : null}

            <div className="w-full">
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-100">Better version:</span>
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-300">
                {betterVersion}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(betterVersion, 0.8)}
                  className="rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  🐢 Slow listen
                </button>
                <button
                  type="button"
                  className="rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                  onClick={() => {
                    speakText(betterVersion, 0.95, () => {
                      yourRecordingRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      setShowRepeatPrompt(true);
                      setShowCloserMessage(true);
                    });
                  }}
                >
                  🎙️ Say this version
                </button>
                <button
                  type="button"
                  onClick={() => void copyText(betterVersion)}
                  className="rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  Copy and send
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Say it now — don’t think, just speak.
              </p>
              {showRepeatPrompt ? (
                <div className="mt-2 text-sm text-yellow-200">
                  Now record your new version.
                </div>
              ) : null}
              {showCloserMessage ? (
                <p className="mt-1 text-sm text-emerald-200">That was closer.</p>
              ) : null}
            </div>

            {isScenarioMode && whyThisWorks ? (
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowWhyThisWorks((prev) => !prev)}
                  className="text-xs text-neutral-400 hover:text-neutral-300"
                >
                  Why this works
                </button>
                {showWhyThisWorks ? (
                  <p className="mt-1 text-sm text-neutral-300">{whyThisWorks}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-sm text-neutral-300">{supportMessage}</p>
        {nextScenario ? (
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-xs text-neutral-400">Next challenge</p>
            <p className="mt-1 text-sm text-neutral-200">🧭 {nextScenario.title}</p>
            <p className="mt-1 text-xs text-neutral-400">{nextScenarioGoal}</p>
          </div>
        ) : null}
        <p className="text-xs text-neutral-400">
          Keep going — one more challenge will make this easier.
        </p>

        <button
          type="button"
          onClick={handleNextChallenge}
          className="w-fit rounded-lg border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800/70"
        >
          Continue to next challenge
        </button>
        <button
          type="button"
          onClick={handleBackToTree}
          className="w-fit text-xs text-neutral-400 underline-offset-2 hover:text-neutral-300 hover:underline"
        >
          Go back to your tree
        </button>
      </section>
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10" />}>
      <FeedbackContent />
    </Suspense>
  );
}
