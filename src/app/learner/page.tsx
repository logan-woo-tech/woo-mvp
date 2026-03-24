"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { mockLearner } from "../../mocks/learner";
import { mockProgress } from "../../mocks/progress";
import TreeView from "../../features/tree/components/TreeView";
import { resolveTreeStage } from "../../features/tree/logic/resolveTreeStage";

const ACTIVITY_LABELS = [
  "Inner Work",
  "Thinking",
  "Mentor",
  "Free Talk",
] as const;
type ActivityLabel = (typeof ACTIVITY_LABELS)[number];
type ActivityKey = "inner-work" | "thinking" | "mentor" | "free-talk";
type Locale = "vi" | "en";

const ACTIVITY_DESCRIPTIONS_LOCALIZED: Record<
  Locale,
  Record<ActivityLabel, string>
> = {
  vi: {
    "Inner Work": "Dừng lại, nhận diện và kết nối với bản thân.",
    Thinking: "Làm rõ một ý tưởng với sự tập trung bình tĩnh.",
    Mentor: "Nhận hướng dẫn nhẹ nhàng cho bước tiếp theo.",
    "Free Talk": "Nói tự nhiên và để suy nghĩ được chảy.",
  },
  en: {
    "Inner Work": "Pause, notice yourself, and reconnect inward.",
    Thinking: "Clarify one idea with calm focus.",
    Mentor: "Get gentle guidance for your next step.",
    "Free Talk": "Speak naturally and let your thoughts flow.",
  },
};

const ACTIVITY_FOCUS_LOCALIZED: Record<Locale, Record<ActivityLabel, string>> = {
  vi: {
    "Inner Work": "Kết nối lại với cảm xúc và nhu cầu của bạn.",
    Thinking: "Biến một ý tưởng thành ý rõ ràng và chắc hơn.",
    Mentor: "Tiến lên với cấu trúc hướng dẫn và sự hỗ trợ.",
    "Free Talk": "Để giọng nói của bạn tự do và tự nhiên hơn.",
  },
  en: {
    "Inner Work": "Reconnect with your emotions and needs.",
    Thinking: "Turn one thought into a clearer, stronger idea.",
    Mentor: "Move forward with support and light structure.",
    "Free Talk": "Let your voice feel freer and more natural.",
  },
};

const ACTIVITY_ICON: Record<ActivityLabel, string> = {
  "Inner Work": "🫶",
  Thinking: "🧠",
  Mentor: "🧭",
  "Free Talk": "💬",
};

const ACTIVITY_LABEL_LOCALIZED: Record<Locale, Record<ActivityLabel, string>> = {
  vi: {
    "Inner Work": "Hiểu mình",
    Thinking: "Làm rõ ý",
    Mentor: "Luyện cùng người hướng dẫn",
    "Free Talk": "Nói tự do",
  },
  en: {
    "Inner Work": "Inner Work",
    Thinking: "Thinking",
    Mentor: "Mentor",
    "Free Talk": "Free Talk",
  },
};

const COPY: Record<
  Locale,
  {
    welcomeBack: string;
    zone: string;
    streak: string;
    growthPrefix: string;
    yourNextStep: string;
    readyLine: string;
    focus: string;
    continueNow: string;
    practiceModes: string;
    quickPractice: string;
    quickPracticeSubtitle: string;
    quickPracticeSupport: string;
    realSituationPractice: string;
    quickRecap: string;
    lastActivity: string;
    whatWentWell: string;
    currentFocus: string;
    exploreMore: string;
    hideExtraPaths: string;
    basedOnLastActivity: string;
    startByGrounding: string;
    quickTryAgain: string;
    treeJustGrew: string;
    scenarioDelayTitle: string;
    scenarioDelayDesc: string;
    scenarioDelayHint: string;
    scenarioUnhappyTitle: string;
    scenarioUnhappyDesc: string;
    scenarioUnhappyHint: string;
    scenarioTimeTitle: string;
    scenarioTimeDesc: string;
    scenarioTimeHint: string;
    startFresh: string;
  }
> = {
  vi: {
    welcomeBack: "Chào mừng bạn quay lại",
    zone: "Hành trình của bạn",
    streak: "Chuỗi ngày",
    growthPrefix: "Bạn đang tiến lên đều mỗi ngày —",
    yourNextStep: "Bước tiếp theo của bạn",
    readyLine: "Bạn đã sẵn sàng cho bước tiếp theo",
    focus: "Tập trung",
    continueNow: "Tiếp tục ngay",
    practiceModes: "Cách luyện",
    quickPractice: "Luyện nhanh (30 giây)",
    quickPracticeSubtitle: "Sửa câu nói của bạn trong 30 giây",
    quickPracticeSupport: "Vòng lặp nhanh: trả lời, thu âm, cải thiện.",
    realSituationPractice: "Tình huống thật",
    quickRecap: "Nhìn lại nhanh",
    lastActivity: "Lần luyện gần nhất",
    whatWentWell: "Điều bạn làm tốt",
    currentFocus: "Tập trung hiện tại",
    exploreMore: "Xem thêm ->",
    hideExtraPaths: "Ẩn bớt lựa chọn",
    basedOnLastActivity: "Được đề xuất từ lần luyện gần nhất",
    startByGrounding: "Bắt đầu nhẹ nhàng để xây dựng tự tin",
    quickTryAgain: "Làm lại ngay (30 giây)",
    treeJustGrew: "Cây của bạn vừa lớn thêm",
    scenarioDelayTitle: "Báo trễ deadline mà vẫn giữ uy tín",
    scenarioDelayDesc:
      "Trình bày rõ ràng về trễ tiến độ mà vẫn giữ được niềm tin.",
    scenarioDelayHint: "Dùng trước khi gửi một tin nhắn thực tế.",
    scenarioUnhappyTitle: "Trả lời khách đang bực mà không làm căng hơn",
    scenarioUnhappyDesc:
      "Phản hồi bình tĩnh và giải quyết sự bức xúc của khách hàng.",
    scenarioUnhappyHint: "Dùng trước khi trả lời một khách hàng thật.",
    scenarioTimeTitle: "Xin thêm thời gian mà vẫn giữ được sự tin tưởng",
    scenarioTimeDesc: "Xin thêm thời gian mà vẫn giữ sự tự tin.",
    scenarioTimeHint: "Dùng trước khi gửi một cập nhật thực tế.",
    startFresh: "Bắt đầu mới",
  },
  en: {
    welcomeBack: "Welcome back",
    zone: "Your journey",
    streak: "Streak",
    growthPrefix: "You are growing with every practice loop —",
    yourNextStep: "Your next step",
    readyLine: "You are ready for your next step",
    focus: "Focus",
    continueNow: "Continue now",
    practiceModes: "Practice modes",
    quickPractice: "Quick practice (30s)",
    quickPracticeSubtitle: "Fix your sentence in 30 seconds",
    quickPracticeSupport: "Fast loop: respond, record, improve.",
    realSituationPractice: "Real situation practice",
    quickRecap: "Quick recap",
    lastActivity: "Last activity",
    whatWentWell: "What went well",
    currentFocus: "Current focus",
    exploreMore: "Explore more ->",
    hideExtraPaths: "Hide extra options",
    basedOnLastActivity: "Recommended from your latest practice",
    startByGrounding: "Start gently to build confidence",
    quickTryAgain: "Try again now (30s)",
    treeJustGrew: "Your tree just grew",
    scenarioDelayTitle: "Report a delay and keep trust",
    scenarioDelayDesc: "Explain delay clearly while staying reliable.",
    scenarioDelayHint: "Use this before sending a real client update.",
    scenarioUnhappyTitle: "Reply to an upset customer calmly",
    scenarioUnhappyDesc: "Respond calmly and move toward solution.",
    scenarioUnhappyHint: "Use this before replying to a real customer.",
    scenarioTimeTitle: "Ask for more time and stay credible",
    scenarioTimeDesc: "Request more time while sounding confident.",
    scenarioTimeHint: "Use this before sending a real update.",
    startFresh: "Fresh start",
  },
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

function getQuickScenarioFromActivity(
  activityKey: ActivityKey | null,
  recommendedActivity: ActivityLabel,
): string {
  if (activityKey === "thinking") return "ask-more-time";
  if (activityKey === "free-talk") return "unhappy-customer";
  if (activityKey === "mentor") return "delay-client";
  if (activityKey === "inner-work") return "delay-client";

  if (recommendedActivity === "Thinking") return "ask-more-time";
  if (recommendedActivity === "Free Talk") return "unhappy-customer";
  return "delay-client";
}

function LearnerContent() {
  const searchParams = useSearchParams();
  const [showExploreMore, setShowExploreMore] = useState(false);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "vi";
    const stored = window.localStorage.getItem("woo_locale");
    return stored === "vi" || stored === "en" ? stored : "vi";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocaleChange = (event: Event) => {
      const custom = event as CustomEvent<{ locale: Locale }>;
      const next = custom.detail?.locale;
      if (next === "vi" || next === "en") {
        setLocale(next);
      }
    };

    window.addEventListener("woo-locale-change", handleLocaleChange);
    return () => {
      window.removeEventListener("woo-locale-change", handleLocaleChange);
    };
  }, []);

  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;
  const lastParam = searchParams.get("last") ?? "";
  const wellParam = searchParams.get("well") ?? "";
  const lastActivity: ActivityKey | null =
    lastParam === "inner-work" ||
    lastParam === "thinking" ||
    lastParam === "mentor" ||
    lastParam === "free-talk"
      ? lastParam
      : null;
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
  const lastActivityLabel = getActivityLabelFromKey(lastActivity);
  const lastActivityIcon = lastActivityLabel
    ? ACTIVITY_ICON[lastActivityLabel]
    : "✨";
  const currentFocus = ACTIVITY_FOCUS_LOCALIZED[locale][recommendedActivity];
  const t = COPY[locale];
  const whatWentWell =
    wellParam.trim() ||
    (locale === "vi"
      ? "Bạn đã xuất hiện và tiến thêm một bước."
      : "You showed up and took one meaningful step.");
  const quickScenarioId = getQuickScenarioFromActivity(
    lastActivity,
    recommendedActivity,
  );
  const recommendedActivityIcon = ACTIVITY_ICON[recommendedActivity];

  const treeState = resolveTreeStage(growthCount);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b1d] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_2%),radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.06),transparent_2%),radial-gradient(circle_at_55%_70%,rgba(255,255,255,0.05),transparent_2%)]" />
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-7">
        <header className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-4 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.35)]">
          <div>
            <p className="text-xs text-neutral-400">{t.welcomeBack}</p>
            <p className="text-base font-medium text-neutral-100">
              {mockLearner.name}
            </p>
          </div>
          <p className="text-sm text-neutral-100">{t.zone}</p>
          <p className="text-sm text-neutral-100">
            {t.streak}: {mockLearner.streakDays}
          </p>
        </header>

        <div className="relative flex justify-center">
          <div className="pointer-events-none absolute inset-x-16 top-4 h-44 rounded-full bg-indigo-400/10 blur-3xl" />
          <TreeView
            tree={treeState}
            growthCount={growthCount}
            lastImprovement={whatWentWell}
          />
        </div>
        <div className="-mt-2 flex flex-col items-center gap-2">
          <p className="text-xs text-emerald-200">{t.treeJustGrew}</p>
          <Link
            href={`/conversation?scenario=${quickScenarioId}&growth=${growthCount}&mode=quick`}
            className="rounded-xl bg-[#F4C542] px-4 py-2 text-sm font-semibold text-[#1B1B1B] shadow-[0_0_20px_rgba(244,197,66,0.18)] transition hover:bg-[#FFD45A]"
          >
            {t.quickTryAgain}
          </Link>
        </div>

        <p className="text-center text-sm text-neutral-300">
          {t.growthPrefix}{" "}
          {locale === "vi"
            ? `${visibleCompletedNodes} / ${totalNodes} bước đã hoàn thành.`
            : `${visibleCompletedNodes} / ${totalNodes} steps completed.`}
        </p>

        <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-4 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.35)]">
          <p className="text-xs text-blue-200">{t.yourNextStep}</p>
          <p className="mt-1 text-xs text-blue-200/90">{t.readyLine}</p>
          <p className="mt-1 text-sm font-medium text-blue-100">
            {recommendedActivityIcon}{" "}
            {ACTIVITY_LABEL_LOCALIZED[locale][recommendedActivity]}
          </p>
          <p className="mt-1 text-xs text-blue-200/90">
            {ACTIVITY_DESCRIPTIONS_LOCALIZED[locale][recommendedActivity]}
          </p>
          <Link
            href={`/conversation?activity=${encodeURIComponent(recommendedActivity)}&growth=${growthCount}&last=${lastActivity ?? ""}`}
            className="mt-3 inline-flex rounded-xl bg-[#F4C542] px-4 py-2 text-sm font-semibold text-[#1B1B1B] shadow-[0_0_20px_rgba(244,197,66,0.18)] transition hover:bg-[#FFD45A]"
          >
            {t.continueNow}
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-neutral-400">{t.practiceModes}</p>
          <Link
            href={`/conversation?scenario=delay-client&growth=${growthCount}&mode=quick`}
            className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-3 text-left text-sm text-neutral-100 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.3)] hover:bg-[rgba(27,39,88,0.52)]"
          >
            <span className="block font-medium">⚡ {t.quickPractice}</span>
            <span className="mt-1 block text-xs text-neutral-300">
              {t.quickPracticeSubtitle}
            </span>
            <span className="mt-1 block text-xs text-neutral-300">
              {t.quickPracticeSupport}
            </span>
          </Link>

          <p className="mt-1 text-xs text-neutral-500">
            {t.realSituationPractice}
          </p>

          <Link
            href={`/conversation?scenario=delay-client&growth=${growthCount}`}
            className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-4 text-left text-sm text-white/90 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.3)] hover:bg-[rgba(27,39,88,0.52)]"
          >
            <span className="block font-medium">
              🧭 {t.scenarioDelayTitle}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioDelayDesc}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioDelayHint}
            </span>
          </Link>

          <Link
            href={`/conversation?scenario=unhappy-customer&growth=${growthCount}`}
            className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-4 text-left text-sm text-white/90 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.3)] hover:bg-[rgba(27,39,88,0.52)]"
          >
            <span className="block font-medium">
              🧭 {t.scenarioUnhappyTitle}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioUnhappyDesc}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioUnhappyHint}
            </span>
          </Link>

          <Link
            href={`/conversation?scenario=ask-more-time&growth=${growthCount}`}
            className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-5 py-4 text-left text-sm text-white/90 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.3)] hover:bg-[rgba(27,39,88,0.52)]"
          >
            <span className="block font-medium">
              🧭 {t.scenarioTimeTitle}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioTimeDesc}
            </span>
            <span className="mt-1 block text-xs text-amber-200/80">
              {t.scenarioTimeHint}
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.38)] px-4 py-3 backdrop-blur-md">
          <p className="text-xs text-neutral-500">{t.quickRecap}</p>
          <p className="mt-1 text-sm text-neutral-300">
            {t.lastActivity}:{" "}
            {lastActivityLabel
              ? `${lastActivityIcon} ${ACTIVITY_LABEL_LOCALIZED[locale][lastActivityLabel]}`
              : `✨ ${t.startFresh}`}
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            {t.whatWentWell}: {whatWentWell}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {t.currentFocus}: {currentFocus}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowExploreMore((prev) => !prev)}
            className="w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            {showExploreMore ? t.hideExtraPaths : t.exploreMore}
          </button>

          {showExploreMore ? (
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_LABELS.map((label) => (
                <Link
                  key={label}
                  href={`/conversation?activity=${encodeURIComponent(label)}&growth=${growthCount}&last=${lastActivity ?? ""}`}
                  className={`rounded-2xl px-5 py-4 text-left text-sm text-neutral-100 backdrop-blur-sm transition-colors hover:bg-white/10 ${
                    label === recommendedActivity
                      ? `border ${ACTIVITY_ACCENT[label]}`
                      : "border border-white/10 bg-[rgba(20,30,70,0.4)]"
                  }`}
                >
                  <span className="block font-medium">
                    {ACTIVITY_ICON[label]} {ACTIVITY_LABEL_LOCALIZED[locale][label]}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-300">
                    {ACTIVITY_DESCRIPTIONS_LOCALIZED[locale][label]}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default function LearnerPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10" />}>
      <LearnerContent />
    </Suspense>
  );
}
