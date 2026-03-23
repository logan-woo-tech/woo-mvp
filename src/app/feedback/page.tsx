"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  return 'Try this next time: Replace "very good" with "effective" or "clear".';
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

function getBetterVersion(scenario: string, tone: string): string {
  const prefix =
    tone === "urgent"
      ? "Urgent update:"
      : tone === "neutral"
        ? "Update:"
        : "Hi, quick update:";

  if (scenario === "Explain a delay to a client") {
    return `${prefix} we are delayed by one day because of a final QA issue. For example, one bug blocked release. The new delivery time is tomorrow 4 PM.`;
  }

  if (scenario === "Handle an unhappy customer") {
    return `${prefix} I understand your frustration because this impacted your timeline. For example, your order arrived incomplete. I will resolve this today and confirm once done.`;
  }

  if (scenario === "Ask for more time professionally") {
    return `${prefix} I need one extra day because I want to deliver this accurately. For example, I am still validating the final numbers. I can send the complete version by tomorrow noon.`;
  }

  if (scenario === "Give a difficult update to your manager") {
    return `${prefix} we are behind plan because a dependency changed. For example, task B took longer than expected. My recovery step is to ship phase one by Friday.`;
  }

  if (scenario === "Say no without sounding rude") {
    return `${prefix} I cannot take this request today because I am committed to a critical deadline. For example, I am finalizing the client launch tasks. I can support tomorrow afternoon.`;
  }

  return `${prefix} I am sharing a clear update because alignment matters. For example, this keeps expectations realistic.`;
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activity = searchParams.get("activity") ?? "Inner Work";
  const answer = searchParams.get("answer") ?? "";
  const scenario = searchParams.get("scenario") ?? "Explain a delay to a client";
  const tone = searchParams.get("tone") ?? "polite";
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
  const activityIcon = ACTIVITY_ICON[activity] ?? "✨";
  const activityAccent = ACTIVITY_ACCENT[activity] ?? "text-neutral-300";
  const nextStepIcon = ACTIVITY_ICON[nextStep] ?? "✨";
  const answerAwareLines = getAnswerAwareFeedback(answer);
  const practicalNextLine = getPracticalNextLine(answer);
  const whatWorks = getWhatWorks(answer);
  const whatToChange = getWhatToChange(answer);
  const betterVersion = getBetterVersion(scenario, tone);
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
          Completed: {activityIcon} {activity}
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
        <div className="flex flex-col gap-1 rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
          <p className="text-sm text-neutral-300">
            <span className="text-neutral-100">What works:</span> {whatWorks}
          </p>
          <p className="text-sm text-neutral-300">
            <span className="text-neutral-100">What to change:</span> {whatToChange}
          </p>
          <p className="text-sm text-neutral-300">
            <span className="text-neutral-100">Better version:</span> {betterVersion}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(betterVersion);
            }}
            className="mt-2 w-fit rounded-md border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800/70"
          >
            Copy better version
          </button>
        </div>
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
