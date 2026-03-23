import { mockLearner } from "../../mocks/learner";
import { mockProgress } from "../../mocks/progress";
import Link from "next/link";

const ACTIVITY_LABELS = [
  "Inner Work",
  "Thinking",
  "Mentor",
  "Free Talk",
] as const;
type ActivityLabel = (typeof ACTIVITY_LABELS)[number];
type ActivityKey = "inner-work" | "thinking" | "mentor" | "free-talk";

const ACTIVITY_DESCRIPTIONS: Record<ActivityLabel, string> = {
  "Inner Work": "Pause, notice, and reconnect with yourself.",
  Thinking: "Clarify one idea with calm focus.",
  Mentor: "Get gentle guidance for your next step.",
  "Free Talk": "Speak openly and let your thoughts flow.",
};

const ACTIVITY_FOCUS: Record<ActivityLabel, string> = {
  "Inner Work": "Reconnect with what you are feeling and what you need.",
  Thinking: "Turn one thought into a clearer, stronger idea.",
  Mentor: "Move forward with guided structure and support.",
  "Free Talk": "Let your voice move more freely and naturally.",
};

const ACTIVITY_ICON: Record<ActivityLabel, string> = {
  "Inner Work": "🫶",
  Thinking: "🧠",
  Mentor: "🧭",
  "Free Talk": "💬",
};

const ACTIVITY_ACCENT: Record<ActivityLabel, string> = {
  "Inner Work": "text-rose-200 border-rose-700/50 bg-rose-950/20",
  Thinking: "text-sky-200 border-sky-700/50 bg-sky-950/20",
  Mentor: "text-amber-200 border-amber-700/50 bg-amber-950/20",
  "Free Talk": "text-emerald-200 border-emerald-700/50 bg-emerald-950/20",
};

function getRecommendation(
  progress: number,
  lastActivity: ActivityKey | null,
): ActivityLabel {
  if (lastActivity === "inner-work") {
    return "Thinking";
  }

  if (lastActivity === "thinking") {
    return "Free Talk";
  }

  if (lastActivity === "free-talk") {
    return "Mentor";
  }

  if (progress <= 1) {
    return "Inner Work";
  }

  if (progress <= 3) {
    return "Thinking";
  }

  return "Mentor";
}

function getRecommendationReason(
  lastActivity: ActivityKey | null,
  recommendedActivity: ActivityLabel,
): string {
  if (lastActivity === "inner-work" && recommendedActivity === "Thinking") {
    return "You checked in with yourself - now turn that clarity into one focused thought.";
  }

  if (lastActivity === "thinking" && recommendedActivity === "Free Talk") {
    return "You have structure in mind - now let your voice flow naturally.";
  }

  if (lastActivity === "free-talk" && recommendedActivity === "Mentor") {
    return "You shared openly - now take one guided step with support.";
  }

  if (recommendedActivity === "Inner Work") {
    return "Start gently: grounding first helps everything else feel clearer.";
  }

  if (recommendedActivity === "Thinking") {
    return "You are ready to sharpen one idea and move with intention.";
  }

  return "You are ready for guided momentum - take the next step with a mentor.";
}

function getActivityLabelFromKey(
  activityKey: ActivityKey | null,
): ActivityLabel | null {
  if (activityKey === "inner-work") {
    return "Inner Work";
  }

  if (activityKey === "thinking") {
    return "Thinking";
  }

  if (activityKey === "free-talk") {
    return "Free Talk";
  }

  if (activityKey === "mentor") {
    return "Mentor";
  }

  return null;
}

type LearnerPageProps = {
  searchParams?: Promise<{
    growth?: string;
    last?: string;
    well?: string;
  }>;
};

export default async function LearnerPage({ searchParams }: LearnerPageProps) {
  const params = (await searchParams) ?? {};
  const growthSignal = Number(params.growth ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;
  const lastParam = params.last ?? "";
  const wellParam = params.well ?? "";
  const lastActivity: ActivityKey | null =
    lastParam === "inner-work" ||
    lastParam === "thinking" ||
    lastParam === "mentor" ||
    lastParam === "free-talk"
      ? lastParam
      : null;
  const whatWentWell =
    wellParam.trim() || "You showed up and took a meaningful step.";

  const totalNodes = mockProgress.length;
  const completedNodes = mockProgress.filter(
    (node) => node.status === "completed",
  ).length;
  const visibleCompletedNodes = Math.min(
    totalNodes,
    completedNodes + growthCount,
  );
  const recommendedActivity = getRecommendation(
    visibleCompletedNodes,
    lastActivity,
  );
  const recommendationReason = getRecommendationReason(
    lastActivity,
    recommendedActivity,
  );
  const lastActivityLabel = getActivityLabelFromKey(lastActivity);
  const lastActivityIcon = lastActivityLabel
    ? ACTIVITY_ICON[lastActivityLabel]
    : "✨";
  const currentFocus = ACTIVITY_FOCUS[recommendedActivity];

  const treeEmoji =
    growthCount >= 4
      ? "🌳✨"
      : growthCount >= 2
        ? "🌳"
        : growthCount >= 1
          ? "🌿"
          : "🌱";

  const treeMessage =
    growthCount >= 4
      ? "Your tree is glowing with steady growth."
      : growthCount >= 2
        ? "Your tree is growing stronger."
        : growthCount >= 1
          ? "Your tree grew a little today."
          : "Small steps, real growth.";

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-7">
        <header className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/60 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="text-xs text-neutral-400">Welcome back</p>
            <p className="text-base font-medium text-neutral-100">
              {mockLearner.name}
            </p>
          </div>
          <p className="text-sm text-neutral-100">Zone: Learner Home</p>
          <p className="text-sm text-neutral-100">
            Streak: {mockLearner.streakDays}
          </p>
        </header>

        <div className="flex justify-center">
          <div className="flex h-72 w-full flex-col items-center justify-center rounded-xl border border-neutral-800/90 bg-neutral-900/40 text-neutral-300">
            <p className="text-6xl" aria-hidden="true">
              {treeEmoji}
            </p>
            <p className="mt-3 text-sm text-neutral-200">{treeMessage}</p>
            {growthCount > 0 ? (
              <p className="mt-2 text-xs text-yellow-300">
                Growth level: {growthCount}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-center text-sm text-neutral-300">
          I am becoming the kind of learner who keeps growing —{" "}
          {visibleCompletedNodes} of {totalNodes} steps completed.
        </p>

        <div className="rounded-xl border border-blue-700/60 bg-blue-950/30 px-5 py-4">
          <p className="text-xs text-blue-200">
            {lastActivity
              ? "Based on your last activity"
              : "Start by grounding yourself and building confidence"}
          </p>
          <p className="mt-1 text-sm font-medium text-blue-100">
            {ACTIVITY_ICON[recommendedActivity]} {recommendedActivity}
          </p>
          <p className="mt-1 text-xs text-blue-200/90">
            {recommendationReason}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
          <p className="text-xs text-neutral-400">Quick recap</p>
          <p className="mt-1 text-sm text-neutral-200">
            Last activity:{" "}
            {lastActivityLabel
              ? `${lastActivityIcon} ${lastActivityLabel}`
              : "✨ Starting fresh"}
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            What went well: {whatWentWell}
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Current focus: {currentFocus}
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-200">
            Recommended next step: {ACTIVITY_ICON[recommendedActivity]}{" "}
            {recommendedActivity}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-neutral-400">Work scenarios</p>

          <Link
            href={`/conversation?scenario=delay-client&growth=${growthCount}`}
            className="rounded-xl border border-amber-700/50 bg-amber-950/20 px-5 py-4 text-left text-sm text-amber-100 hover:bg-amber-900/30"
          >
            <span className="block font-medium">
              🧭 Explain a delay to a client
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              Communicate delays clearly without losing trust.
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              Use this before sending a real message.
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_LABELS.map((label) => (
            <Link
              key={label}
              href={`/conversation?activity=${encodeURIComponent(label)}&growth=${growthCount}&last=${lastActivity ?? ""}`}
              className={`rounded-xl px-5 py-4 text-left text-sm text-neutral-100 transition-colors hover:bg-neutral-800/70 ${
                label === recommendedActivity
                  ? `border ${ACTIVITY_ACCENT[label]}`
                  : "border border-neutral-700 bg-neutral-900/40"
              }`}
            >
              <span className="block font-medium">
                {ACTIVITY_ICON[label]} {label}
              </span>
              <span className="mt-1 block text-xs text-neutral-300">
                {ACTIVITY_DESCRIPTIONS[label]}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
