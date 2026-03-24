"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getWorkScenario,
  type WorkScenarioId,
  type WorkScenarioTone,
} from "../../mocks/workScenarios";
import { getQuickScenario } from "../../mocks/quickScenarios";

const VOICE_STORAGE_KEY = "woo_voice_practice_v1";

const ACTIVITY_FEEDBACK: Record<string, string> = {
  "Inner Work":
    "Bạn đã chạm vào cảm xúc thật và nói ra điều mình đang thấy.",
  Thinking: "Bạn đã sắp xếp ý rõ và có lý do đi kèm.",
  "Free Talk":
    "Bạn đã nói tự nhiên hơn và thoải mái hơn.",
  Mentor:
    "Bạn đã chọn hướng đi rõ và chốt được bước tiếp theo.",
};

const ACTIVITY_SUPPORT: Record<string, string> = {
  "Inner Work": "Giữ sự mềm mại này khi bạn đi tiếp.",
  Thinking: "Giữ cấu trúc này để quyết định sau dễ hơn.",
  "Free Talk": "Cứ mở lòng, càng nói càng rõ.",
  Mentor: "Giờ thì đi tiếp bằng hành động cụ thể.",
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

const ACTIVITY_LABEL_VI: Record<string, string> = {
  "Inner Work": "Hiểu mình",
  Thinking: "Làm rõ ý",
  "Free Talk": "Nói tự do",
  Mentor: "Luyện cùng người hướng dẫn",
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
    intro: "Bạn đã báo trễ rõ ràng mà vẫn giữ sự chuyên nghiệp.",
    support: "Giữ giọng bình tĩnh, nói cụ thể, và hướng vào giải pháp.",
    nextStepLabel: "Trả lời khách đang bực",
    nextStepScenarioId: "unhappy-customer",
  },
  "unhappy-customer": {
    intro: "Bạn đã thừa nhận cảm xúc của khách và phản hồi chuyên nghiệp.",
    support: "Bắt đầu bằng sự thấu cảm, rồi chuyển rõ sang hướng xử lý.",
    nextStepLabel: "Xin thêm thời gian",
    nextStepScenarioId: "ask-more-time",
  },
  "ask-more-time": {
    intro: "Bạn đã xin thêm thời gian rõ ràng mà không bị thiếu tự tin.",
    support: "Nói cụ thể deadline mới để thể hiện bạn đang kiểm soát tình huống.",
    nextStepLabel: "Báo trễ deadline",
    nextStepScenarioId: "delay-client",
  },
};

function getAnswerAwareFeedback(answer: string): string[] {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();
  const lines: string[] = [];

  if (trimmed.length >= 120) {
    lines.push("Bạn đã đi sâu vào ý chính, không dừng quá sớm.");
  }

  if (normalized.includes("because")) {
    lines.push("Lý do bạn đưa ra khá rõ và thuyết phục.");
  }

  if (normalized.includes("for example") || normalized.includes("example")) {
    lines.push("Ví dụ của bạn giúp ý này đáng tin hơn.");
  }

  if (lines.length === 0 && trimmed.length > 0) {
    lines.push("Khởi đầu ổn rồi, giờ thêm một chi tiết cụ thể nữa là đẹp.");
  }

  return lines.slice(0, 2);
}

function getPracticalNextLine(answer: string): string {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized.includes("because")) {
    return 'Lần sau thử thêm một câu "because" để chốt lý do rõ hơn.';
  }

  if (!normalized.includes("for example") && !normalized.includes("example")) {
    return "Lần sau thử thêm một ví dụ thật để câu trả lời thuyết phục hơn.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Lần sau nói dài hơn một chút và thêm một chi tiết nữa.";
  }

  return "Lần sau thay một cụm chung chung bằng cách nói cụ thể hơn.";
}

function getWhatToChange(
  answer: string,
  scenarioId?: WorkScenarioId | null,
): string {
  if (scenarioId === "delay-client") {
    return "Nói deadline mới cụ thể hơn.";
  }

  if (scenarioId === "unhappy-customer") {
    return "Thể hiện sự thấu cảm trước khi giải thích vấn đề.";
  }

  if (scenarioId === "ask-more-time") {
    return "Nói deadline rõ và chắc hơn.";
  }

  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized.includes("because")) {
    return 'Thêm một lý do rõ ràng bằng "because".';
  }

  if (!normalized.includes("for example") && !normalized.includes("example")) {
    return "Thêm một ví dụ ngắn để tăng độ tin cậy.";
  }

  if (trimmed.length > 0 && trimmed.length < 100) {
    return "Thêm một câu để khách hiểu cả vấn đề lẫn bước tiếp theo.";
  }

  return "Gọt một câu cho gọn để ý chính vào nhanh hơn.";
}

function getStructureStarter(scenarioId?: WorkScenarioId | null): string {
  if (scenarioId === "delay-client") {
    return "Nêu lý do trước";
  }

  if (scenarioId === "unhappy-customer") {
    return "Thấu cảm trước";
  }

  if (scenarioId === "ask-more-time") {
    return "Nói deadline mới rõ ràng";
  }

  return "Bắt đầu bằng một ý thật rõ";
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
    const acknowledgeIssue =
      normalized.includes("delay") ||
      normalized.includes("late") ||
      normalized.includes("trễ") ||
      normalized.includes("chậm");
    return [
      {
        label: "Thừa nhận vấn đề",
        status: acknowledgeIssue ? "done" : "missing",
      },
      {
        label: "Giải thích lý do",
        status: normalized.includes("because") ? "done" : "missing",
      },
      {
        label: "Nêu timeline cụ thể",
        status: hasTimelineHint ? "done" : "missing",
      },
      {
        label: "Trấn an khách hàng",
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
        label: "Thể hiện thấu cảm",
        status:
          normalized.includes("understand") ||
          normalized.includes("sorry") ||
          normalized.includes("frustrating")
            ? "done"
            : "missing",
      },
      {
        label: "Thể hiện là mình đang chủ động xử lý",
        status: normalized.includes("we") ? "done" : "missing",
      },
      {
        label: "Đưa ra hướng xử lý",
        status:
          normalized.includes("fix") || normalized.includes("resolve")
            ? "done"
            : "missing",
      },
      {
        label: "Cho biết bước tiếp theo là gì",
        status:
          normalized.includes("update") || normalized.includes("soon")
            ? "done"
            : "missing",
      },
    ];
  }

  if (scenarioId === "ask-more-time") {
    const hasContextHint =
      normalized.includes("deadline") ||
      normalized.includes("time") ||
      normalized.includes("timeline") ||
      normalized.includes("thời gian") ||
      normalized.includes("tiến độ");
    const weakConfidence =
      /\bmaybe\b/.test(normalized) ||
      /\btry\b/.test(normalized) ||
      /\bhopefully\b/.test(normalized);

    return [
      {
        label: "Nói bối cảnh ngắn gọn",
        status: hasContextHint ? "done" : "missing",
      },
      {
        label: "Nói rõ lý do",
        status: normalized.includes("because") ? "done" : "missing",
      },
      {
        label: "Nêu deadline cụ thể",
        status: hasTimelineHint ? "done" : "missing",
      },
      {
        label: "Giữ giọng chắc chắn",
        status: weakConfidence ? "missing" : "done",
      },
    ];
  }

  return [];
}

function getWhyThisWorks(scenarioId?: string): string {
  if (scenarioId === "delay-client") {
    return "Bạn chuyển từ xin lỗi sang nói rõ và chủ động xử lý. Cách này tạo niềm tin tốt hơn.";
  }

  if (scenarioId === "unhappy-customer") {
    return "Bạn thừa nhận cảm xúc trước nên hạ nhiệt tốt. Sau đó chuyển sang hướng xử lý nên dễ lấy lại niềm tin.";
  }

  if (scenarioId === "ask-more-time") {
    return "Bạn đổi lời hứa mơ hồ thành cam kết rõ ràng. Tin nhắn vì vậy đáng tin hơn.";
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
      why: "Cụm này khá mơ hồ, nghe chưa đủ chắc chắn.",
      better: "Nên chốt thời gian cụ thể, ví dụ: 'by tomorrow at 4 PM'.",
    },
    {
      phrase: "sớm nhất có thể",
      why: "Cụm này khá chung chung, chưa tạo cảm giác chắc chắn.",
      better: "Nên chốt mốc thời gian cụ thể bạn sẽ gửi/cập nhật.",
    },
    {
      phrase: "try my best",
      why: "Cách nói này dễ tạo cảm giác thiếu chắc chắn.",
      better:
        "Nên nói theo cam kết rõ, ví dụ: 'I will send the updated version by...'.",
    },
    {
      phrase: "em sẽ cố gắng",
      why: "Cách nói này dễ bị hiểu là chưa có cam kết rõ.",
      better: "Đổi sang câu có mốc thời gian cụ thể và hành động rõ ràng.",
    },
    {
      phrase: "maybe",
      why: "Từ này làm câu trả lời nghe thiếu tự tin.",
      better: "Đổi sang cách nói chắc hơn và có bước tiếp theo rõ ràng.",
    },
    {
      phrase: "chắc là",
      why: "Cụm này làm thông điệp nghe thiếu chắc chắn.",
      better: "Nói thẳng phương án và mốc thời gian cụ thể.",
    },
    {
      phrase: "hopefully",
      why: "Trong cập nhật công việc, cụm này nghe khá bị động.",
      better: "Nói rõ bạn sẽ làm gì và làm khi nào.",
    },
    {
      phrase: "hy vọng",
      why: "Nếu đứng một mình, cụm này nghe khá bị động.",
      better: "Đi kèm kế hoạch hành động và thời điểm cụ thể.",
    },
  ] as const;

  const unhappyCustomerRules = [
    {
      phrase: "calm down",
      why: "Khi khách đang bực, câu này dễ tạo cảm giác bị gạt đi.",
      better:
        "Nên thừa nhận cảm xúc trước, ví dụ: 'I understand why this is frustrating.'",
    },
    {
      phrase: "you misunderstood",
      why: "Câu này dễ tạo cảm giác đổ lỗi và làm căng thẳng tăng lên.",
      better: "Nói lại vấn đề thật bình tĩnh, tránh quy lỗi cho khách.",
    },
    {
      phrase: "it's not our fault",
      why: "Câu này dễ đẩy xung đột lên cao và làm giảm niềm tin.",
      better: "Tập trung vào việc bạn sẽ làm gì tiếp theo để xử lý.",
    },
    {
      phrase: "please be patient",
      why: "Nếu không có hành động cụ thể đi kèm, câu này nghe khá thụ động.",
      better: "Đi kèm với một hành động rõ và mốc thời gian cụ thể.",
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
  const mode = searchParams.get("mode");
  const isQuickMode = mode === "quick";

  const scenarioIdParam = searchParams.get("scenario");
  const scenario = getWorkScenario(scenarioIdParam);
  const quickScenario = isQuickMode
    ? getQuickScenario(scenarioIdParam) ?? getQuickScenario("unhappy-customer-quick")
    : null;
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
        "Bạn đã xuất hiện và luyện nghiêm túc hôm nay. Giữ nhịp này nhé.");

  const supportMessage =
    isScenarioMode && scenarioMeta
      ? scenarioMeta.support
      : (ACTIVITY_SUPPORT[activity ?? "Inner Work"] ??
        "Cứ đi đều từng bước nhỏ, mỗi bước đều có ý nghĩa.");

  const activityIcon = isScenarioMode
    ? "🧭"
    : (ACTIVITY_ICON[activity ?? "Inner Work"] ?? "✨");

  const activityAccent = isScenarioMode
    ? "text-amber-200"
    : (ACTIVITY_ACCENT[activity ?? "Inner Work"] ?? "text-neutral-300");
  const activityLabelVi = ACTIVITY_LABEL_VI[activity ?? "Inner Work"] ?? "Hiểu mình";

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
      ? "Câu trả lời của bạn đã có đủ các phần chính."
      : structureTotalCount > 0
        ? `${structureDoneCount}/${structureTotalCount} phần đã ổn.`
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
  const [showRiskyPhraseDetails, setShowRiskyPhraseDetails] = useState(false);
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
  const nextQuickScenario = quickScenario?.nextScenarioId
    ? getQuickScenario(quickScenario.nextScenarioId)
    : null;
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
    if (isQuickMode && nextQuickScenario) {
      router.push(
        `/conversation?scenario=${encodeURIComponent(nextQuickScenario.id)}&growth=${nextGrowth}&mode=quick&well=${encodeURIComponent(reflectionSummary)}`,
      );
      return;
    }
    if (isScenarioMode && scenarioMeta?.nextStepScenarioId) {
      router.push(
        `/conversation?scenario=${encodeURIComponent(scenarioMeta.nextStepScenarioId)}&growth=${nextGrowth}&well=${encodeURIComponent(reflectionSummary)}`,
      );
      return;
    }
    handleBackToTree();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b1d] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_2%),radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.06),transparent_2%),radial-gradient(circle_at_55%_70%,rgba(255,255,255,0.05),transparent_2%)]" />
      <section className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] p-6 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.35)]">
        <p className={`text-xs ${activityAccent}`}>
          Hoàn thành: {activityIcon}{" "}
          {isScenarioMode && scenario
            ? scenario.shortLabel
            : activityLabelVi}
        </p>

        <h1 className="text-lg text-neutral-100">Phản hồi</h1>
        <p className="text-sm text-neutral-300">Bạn đã làm tốt hơn so với lần trước</p>
        <p className="text-sm font-medium text-neutral-100">+1 Tiến bộ</p>

        {!isQuickMode ? (
          <p className="text-sm text-neutral-300">{feedbackMessage}</p>
        ) : null}

        {!isQuickMode && answerAwareLines.length > 0 ? (
          <div className="flex flex-col gap-1">
            {answerAwareLines.map((line) => (
              <p key={line} className="text-sm text-neutral-300">
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {!isQuickMode ? (
          <p className="text-sm text-neutral-300">{practicalNextLine}</p>
        ) : null}

        {!isScenarioMode && voiceRecordingUrl ? (
          <div
            ref={yourRecordingRef}
            className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md"
          >
            <p className="text-xs text-neutral-400">Bản thu của bạn</p>
            <audio
              ref={voiceAudioRef}
              src={voiceRecordingUrl}
              preload="auto"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => void voiceAudioRef.current?.play()}
              className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              ▶️ Nghe
            </button>
            <p className="mt-2 text-xs text-neutral-400">
              Bản nào nghe tự tin hơn — của bạn hay bản gợi ý?
            </p>
            <p className="text-xs text-neutral-400">
              Giờ thử nói lại theo bản gợi ý này.
            </p>
          </div>
        ) : null}

        {isQuickMode && quickScenario ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-100">Điểm cần sửa chính:</span>{" "}
              {quickScenario.primaryFix}
            </p>
            {voiceRecordingUrl ? (
              <div
                ref={yourRecordingRef}
                className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-neutral-400">Bản thu của bạn</p>
                <audio
                  ref={voiceAudioRef}
                  src={voiceRecordingUrl}
                  preload="auto"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => void voiceAudioRef.current?.play()}
                  className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  ▶️ Nghe
                </button>
              </div>
            ) : null}
            <div className="w-full">
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-100">Bản gợi ý:</span>{" "}
                {quickScenario.betterVersion}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                  onClick={() => {
                    speakText(quickScenario.betterVersion, 0.95, () => {
                      yourRecordingRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      setShowRepeatPrompt(true);
                      setShowCloserMessage(true);
                    });
                  }}
                >
                  🎙️ Nói theo bản gợi ý
                </button>
              </div>
              {showRepeatPrompt ? (
                <div className="mt-2 text-sm text-yellow-200">
                  Giờ thu lại phiên bản mới của bạn.
                </div>
              ) : null}
              {showCloserMessage ? (
                <p className="mt-1 text-sm text-emerald-200">Đã gần đúng hơn rồi.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isQuickMode && isScenarioMode ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-100">Điểm cần sửa chính:</span>{" "}
              {whatToChange}
            </p>

            {structureChecklist.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
                <p className="text-sm text-neutral-100">
                  Một câu trả lời mạnh cần
                </p>
                <p className="text-xs text-neutral-400">Bắt đầu từ một điểm:</p>
                <p className="text-xs text-neutral-400">
                  {getStructureStarter(scenario?.id)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowStructureDetails((prev) => !prev)}
                  className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  {showStructureDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
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
                      Dựa vào các phần còn thiếu để sửa bản trả lời tiếp theo.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {isScenarioMode && riskyPhrases.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
                <p className="text-sm text-neutral-100">Phát hiện cụm từ rủi ro</p>
                <p className="text-xs text-neutral-400">
                  Có {riskyPhrases.length} cụm nên chỉnh để câu trả lời chắc hơn.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRiskyPhraseDetails((prev) => !prev)}
                  className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  {showRiskyPhraseDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
                </button>
                {showRiskyPhraseDetails
                  ? riskyPhrases.map((item) => (
                      <div key={item.phrase} className="flex flex-col gap-1">
                        <p className="text-sm text-neutral-300">
                          <span className="text-neutral-100">
                            &quot;{item.phrase}&quot;
                          </span>{" "}
                          — {item.why}
                        </p>
                        <p className="text-sm text-neutral-300">
                          <span className="text-neutral-100">Gợi ý tốt hơn:</span>{" "}
                          {item.better}
                        </p>
                      </div>
                    ))
                  : null}
              </div>
            ) : null}

            {voiceRecordingUrl ? (
              <div
                ref={yourRecordingRef}
                className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-neutral-400">Bản thu của bạn</p>
                <audio
                  ref={voiceAudioRef}
                  src={voiceRecordingUrl}
                  preload="auto"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => void voiceAudioRef.current?.play()}
                  className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  ▶️ Nghe
                </button>
                <p className="mt-2 text-xs text-neutral-400">
                  Bản nào nghe tự tin hơn — của bạn hay bản gợi ý?
                </p>
                <p className="text-xs text-neutral-400">
                  Giờ thử nói lại theo bản gợi ý này.
                </p>
              </div>
            ) : null}

            <div className="w-full">
              <p className="text-sm text-neutral-300">
                <span className="text-neutral-100">Bản gợi ý:</span>
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-300">
                {betterVersion}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(betterVersion, 0.8)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  🐢 Nghe chậm
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
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
                  🎙️ Nói theo bản gợi ý
                </button>
                <button
                  type="button"
                  onClick={() => void copyText(betterVersion)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  Sao chép để dùng ngay
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Nói luôn — đừng nghĩ nhiều, cứ nói.
              </p>
              {showRepeatPrompt ? (
                <div className="mt-2 text-sm text-yellow-200">
                  Giờ thu lại phiên bản mới của bạn.
                </div>
              ) : null}
              {showCloserMessage ? (
                <p className="mt-1 text-sm text-emerald-200">Đã gần đúng hơn rồi.</p>
              ) : null}
            </div>

            {isScenarioMode && whyThisWorks ? (
              <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setShowWhyThisWorks((prev) => !prev)}
                  className="text-xs text-neutral-400 hover:text-neutral-300"
                >
                  Vì sao cách này hiệu quả
                </button>
                {showWhyThisWorks ? (
                  <p className="mt-1 text-sm text-neutral-300">{whyThisWorks}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {!isQuickMode ? <p className="text-sm text-neutral-300">{supportMessage}</p> : null}
        {!isQuickMode && nextScenario ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-neutral-400">Thử thách tiếp theo</p>
            <p className="mt-1 text-sm text-neutral-200">🧭 {nextScenario.title}</p>
            <p className="mt-1 text-xs text-neutral-400">{nextScenarioGoal}</p>
          </div>
        ) : null}
        {!isQuickMode ? (
          <p className="text-xs text-neutral-400">
            Đi tiếp nhé — thêm một vòng nữa sẽ thấy dễ hơn.
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleNextChallenge}
          className="w-fit rounded-xl bg-[#F4C542] px-4 py-2 text-sm font-semibold text-[#1B1B1B] shadow-[0_0_20px_rgba(244,197,66,0.18)] transition hover:bg-[#FFD45A]"
        >
          Tiếp tục thử thách tiếp theo
        </button>
        <button
          type="button"
          onClick={handleBackToTree}
          className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
        >
          Về lại cây của bạn
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
