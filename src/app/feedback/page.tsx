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

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activity = searchParams.get("activity") ?? "Inner Work";
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
  const activityIcon = ACTIVITY_ICON[activity] ?? "✨";
  const activityAccent = ACTIVITY_ACCENT[activity] ?? "text-neutral-300";
  const nextStepIcon = ACTIVITY_ICON[nextStep] ?? "✨";
  const answerAwareLines = getAnswerAwareFeedback(answer);
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
