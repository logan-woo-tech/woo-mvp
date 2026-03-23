"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockConversation } from "../../mocks/conversation";

const ACTIVITY_QUESTIONS: Record<string, string[]> = {
  "Inner Work": [
    "What feeling is most present for you right now?",
    "What feeling is most present, and what need is underneath it?",
    "What recurring inner pattern do you notice, and what would a kinder response look like today?",
  ],
  Thinking: [
    "What is one idea you want to examine today?",
    "What is one idea you want to examine, and why do you think that?",
    "What assumption might be shaping your thinking, and how would you test it with a real example?",
  ],
  "Free Talk": [
    "What is most on your mind right now?",
    "What feels important to express right now, even if it is unfinished?",
    "If you spoke with complete honesty, what truth would you want to hear yourself say today?",
  ],
  Mentor: [
    "What is one goal you want to move forward today?",
    "What is your next goal, what is one obstacle, and what first step will you take?",
    "What strategic next step will create momentum this week, and how will you hold yourself accountable?",
  ],
};

const ACTIVITY_FRAMING: Record<string, string> = {
  "Inner Work": "Coach focus: slow down and listen inward.",
  Thinking: "Coach focus: turn thoughts into clear reasoning.",
  "Free Talk": "Coach focus: express freely without judgment.",
  Mentor: "Coach focus: define a practical next step.",
};

const ACTIVITY_SUPPORT_TEXT: Record<string, string> = {
  "Inner Work":
    "Name one feeling honestly, then connect it to what you need right now.",
  Thinking:
    "Pick one idea and test it with a clear reason and a concrete example.",
  "Free Talk":
    "Let your first honest thoughts come out; clarity often follows expression.",
  Mentor:
    "Keep it actionable: goal, obstacle, and the next small move you can commit to.",
};

const ACTIVITY_PLACEHOLDER: Record<string, string> = {
  "Inner Work": "I notice I am feeling... and I think I need...",
  Thinking: "My idea is... The reason is... One example is...",
  "Free Talk": "Right now what feels most alive for me is...",
  Mentor: "My goal is... My obstacle is... My first next step is...",
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

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activity = searchParams.get("activity") ?? "Inner Work";
  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;
  const last = searchParams.get("last") ?? "";

  const fallbackQuestion =
    mockConversation.find((message) => message.role === "coach")?.text ??
    "How are you feeling right now?";
  const questionLevel = growthCount >= 4 ? 2 : growthCount >= 2 ? 1 : 0;
  const questionSet = ACTIVITY_QUESTIONS[activity];
  const question =
    questionSet?.[questionLevel] ?? questionSet?.[0] ?? fallbackQuestion;
  const framing =
    ACTIVITY_FRAMING[activity] ??
    "Coach focus: speak with honesty and intention.";
  const supportText =
    ACTIVITY_SUPPORT_TEXT[activity] ??
    "Take a breath, then share: what happened, why it mattered, and one real example.";
  const placeholder =
    ACTIVITY_PLACEHOLDER[activity] ?? "Write your answer here...";
  const activityIcon = ACTIVITY_ICON[activity] ?? "✨";
  const activityAccent = ACTIVITY_ACCENT[activity] ?? "text-neutral-300";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawAnswer = String(formData.get("answer") ?? "");
    const answer = rawAnswer.trim().slice(0, 800);
    router.push(
      `/feedback?activity=${encodeURIComponent(activity)}&growth=${growthCount}&last=${encodeURIComponent(last)}&answer=${encodeURIComponent(answer)}`,
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6"
      >
        <p className={`text-xs ${activityAccent}`}>
          Current activity: {activityIcon} {activity}
        </p>
        <p className="text-xs text-neutral-300">{framing}</p>

        <h1 className="text-lg text-neutral-100">{question}</h1>

        <p className="text-sm text-neutral-300">{supportText}</p>

        <p className="text-xs text-neutral-400">Your answer</p>

        <textarea
          name="answer"
          rows={6}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-500"
        />

        <button
          type="submit"
          className="w-fit rounded-lg border border-neutral-600 bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
