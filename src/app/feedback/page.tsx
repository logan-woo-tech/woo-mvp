"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getWorkScenario,
  type WorkScenarioTone,
} from "../../mocks/workScenarios";

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

const NEXT_STEP: Record<string, string> = {
  "Inner Work": "Thinking",
  Thinking: "Free Talk",
  "Free Talk": "Mentor",
  Mentor: "Inner Work",
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
    lines.push("Your example makes your idea easier to understand.");
  }

  if (lines.length === 0 && trimmed.length > 0) {
    lines.push(
      "Clear and honest response - keep building from this starting point.",
    );
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
    return "Try this next time: add one real example to make your point concrete.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Try this next time: stay with your answer a little longer and add one more layer.";
  }

  return 'Try this next time: replace a general word like "good" with a more precise word.';
}

function getWhatWorks(answer: string): string {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized.includes("because")) {
    return "You explained your reason clearly.";
  }

  if (normalized.includes("for example") || normalized.includes("example")) {
    return "You made your point concrete with an example.";
  }

  if (trimmed.length >= 120) {
    return "You stayed with your message and gave useful detail.";
  }

  return "You communicated directly and kept a calm tone.";
}

function getWhatToChange(answer: string): string {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized.includes("because")) {
    return 'Add one clear reason with "because".';
  }

  if (!normalized.includes("for example") && !normalized.includes("example")) {
    return "Add one short example to increase credibility.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Stay with your answer longer and add one more sentence.";
  }

  return "Tighten one phrase so your key point lands faster.";
}

function buildScenarioBetterVersion(
  scenarioId: string,
  tone: WorkScenarioTone,
): string {
  const prefix =
    tone === "formal"
      ? "I’d like to update you that"
      : tone === "neutral"
        ? "Update:"
        : "Quick update —";

  if (scenarioId === "delay-client") {
    return `${prefix} we are slightly behind schedule because we identified an issue during testing. To ensure quality, we are fixing it now and will provide an update shortly.`;
  }

  return `${prefix} I’m sharing a clear update because alignment matters. We will keep you posted.`;
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore for now
  }
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activity = searchParams.get("activity") ?? "Inner Work";
  const scenarioId = searchParams.get("scenario");
  const scenario = getWorkScenario(scenarioId);
  const tone =
    (searchParams.get("tone") as WorkScenarioTone | null) ?? "formal";

  const answer = searchParams.get("answer") ?? "";
  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;

  const feedbackMessage =
    ACTIVITY_FEEDBACK[activity] ??
    "You showed up with intention today. Keep this momentum going.";
  const supportMessage =
    ACTIVITY_SUPPORT[activity] ??
    "Keep moving with steady intention, one meaningful step at a time.";
  const nextStep = NEXT_STEP[activity] ?? "Inner Work";

  const activityIcon = scenario ? "🧭" : (ACTIVITY_ICON[activity] ?? "✨");
  const activityAccent = scenario
    ? "text-amber-200"
    : (ACTIVITY_ACCENT[activity] ?? "text-neutral-300");
  const nextStepIcon = ACTIVITY_ICON[nextStep] ?? "✨";

  const answerAwareLines = getAnswerAwareFeedback(answer);
  const practicalNextLine = getPracticalNextLine(answer);
  const whatWorks = getWhatWorks(answer);
  const whatToChange = getWhatToChange(answer);
  const betterVersion = scenario
    ? buildScenarioBetterVersion(scenario.id, tone)
    : "";

  const reflectionSummary = answerAwareLines[0] ?? feedbackMessage;

  function handleContinue() {
    const nextGrowth = growthCount + 1;
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

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6">
        <p className={`text-xs ${activityAccent}`}>
          Completed: {activityIcon} {scenario ? scenario.shortLabel : activity}
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

        {scenario ? (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-100">What works:</span> {whatWorks}
            </p>
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-100">What to change:</span>{" "}
              {whatToChange}
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-100">Better version:</span>{" "}
                {betterVersion}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(betterVersion)}
                  className="rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  🔊 Listen
                </button>
                <button
                  type="button"
                  onClick={() => void copyText(betterVersion)}
                  className="rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
                >
                  Copy better version
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <p className="text-sm text-neutral-300">{supportMessage}</p>

        <p className="text-sm font-medium text-yellow-200">
          Next step: {nextStepIcon} {nextStep}
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className="w-fit rounded-lg border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800/70"
        >
          Back to your tree
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
