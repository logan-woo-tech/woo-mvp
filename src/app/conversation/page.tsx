"use client";

import React, { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockConversation } from "../../mocks/conversation";
import {
  getWorkScenario,
  type WorkScenarioTone,
} from "../../mocks/workScenarios";
import { getQuickScenario } from "../../mocks/quickScenarios";

const ACTIVITY_QUESTIONS: Record<string, string[]> = {
  "Inner Work": [
    "Lúc này cảm xúc nào đang rõ nhất trong bạn?",
    "Cảm xúc nào đang rõ nhất, và bên dưới nó là nhu cầu gì?",
    "Bạn đang thấy mẫu cảm xúc nào lặp lại, và hôm nay bạn có thể phản hồi với chính mình dịu hơn thế nào?",
  ],
  Thinking: [
    "Hôm nay bạn muốn làm rõ ý nào?",
    "Bạn muốn làm rõ ý nào, và vì sao bạn nghĩ vậy?",
    "Giả định nào đang chi phối cách bạn nghĩ, và bạn sẽ kiểm tra nó bằng ví dụ thực tế nào?",
  ],
  "Free Talk": [
    "Lúc này điều gì đang ở trong đầu bạn nhiều nhất?",
    "Điều gì quan trọng để nói ra lúc này, dù vẫn còn dang dở?",
    "Nếu nói thật hoàn toàn, hôm nay bạn muốn nghe chính mình nói ra điều gì?",
  ],
  Mentor: [
    "Hôm nay bạn muốn đẩy mục tiêu nào đi tiếp?",
    "Mục tiêu tiếp theo là gì, trở ngại là gì, và bước đầu tiên bạn sẽ làm là gì?",
    "Tuần này bước đi chiến lược nào sẽ tạo đà, và bạn sẽ tự cam kết ra sao?",
  ],
};

const ACTIVITY_FRAMING: Record<string, string> = {
  "Inner Work": "Trọng tâm: chậm lại và lắng nghe bên trong.",
  Thinking: "Trọng tâm: biến suy nghĩ thành lập luận rõ ràng.",
  "Free Talk": "Trọng tâm: nói tự nhiên, không tự phán xét.",
  Mentor: "Trọng tâm: chốt một bước đi thực tế.",
};

const ACTIVITY_SUPPORT_TEXT: Record<string, string> = {
  "Inner Work":
    "Gọi tên một cảm xúc thật rõ, rồi nối nó với điều bạn đang cần.",
  Thinking:
    "Chọn một ý và kiểm tra bằng lý do rõ ràng cùng một ví dụ cụ thể.",
  "Free Talk":
    "Để những ý nghĩ thật nhất đi ra trước; khi nói ra rồi sẽ rõ hơn.",
  Mentor:
    "Giữ mọi thứ có thể hành động: mục tiêu, trở ngại, và bước nhỏ bạn cam kết làm.",
};

const ACTIVITY_PLACEHOLDER: Record<string, string> = {
  "Inner Work": "Mình đang thấy... và lúc này mình cần...",
  Thinking: "Ý của mình là... Lý do là... Ví dụ là...",
  "Free Talk": "Lúc này điều mình thấy rõ nhất là...",
  Mentor: "Mục tiêu của mình là... Trở ngại là... Bước đầu tiên là...",
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

const ACTIVITY_HELPFUL_WORDS: Record<string, string[]> = {
  "Inner Work": ["cảm xúc", "nhu cầu", "căng thẳng", "bình tĩnh", "thật lòng"],
  Thinking: ["ý chính", "lý do", "because", "for example", "kết quả"],
  "Free Talk": ["hôm nay", "mắc kẹt", "năng lượng", "điều thật", "thả lỏng"],
  Mentor: ["mục tiêu", "trở ngại", "bước đi", "deadline", "cam kết"],
};

const ACTIVITY_SAMPLE_ANSWER: Record<string, string> = {
  "Inner Work":
    "I feel a little scattered today because I am carrying too many open tasks. For example, I keep switching tabs and losing focus.",
  Thinking:
    "My idea is that short planning helps me start faster because it reduces decision fatigue. For example, a 5-minute plan helped me finish yesterday's task.",
  "Free Talk":
    "What feels most alive is a mix of excitement and pressure. I want to move forward, and I also want to give myself permission to go one step at a time.",
  Mentor:
    "My goal is to complete one meaningful task today because progress builds confidence. For example, I will draft section one before lunch and review it at 4 pm.",
};

function getDifficultyLabel(growthCount: number) {
  if (growthCount >= 4) return "Sâu";
  if (growthCount >= 2) return "Vừa";
  return "Cơ bản";
}

function buildLiveHints(
  answer: string,
  scenarioId: string | null | undefined,
  activity: string,
): string[] {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();
  if (scenarioId === "delay-client") {
    const hints: string[] = [];
    if (!normalized.includes("because")) {
      hints.push("Nói rõ lý do.");
    }
    if (!normalized.includes("for example") && !normalized.includes("example")) {
      hints.push("Thêm một ví dụ cụ thể.");
    }
    return hints.slice(0, 2);
  }

  if (scenarioId === "unhappy-customer") {
    return [
      "Thừa nhận cảm xúc của khách trước.",
      "Sau đó nói rõ bạn sẽ xử lý thế nào.",
    ];
  }

  if (scenarioId === "ask-more-time") {
    return [
      "Nói rõ deadline mới.",
      "Tránh nói mơ hồ kiểu 'sớm nhất có thể'.",
    ];
  }

  if (activity === "Thinking") {
    const hints: string[] = [];
    if (!normalized.includes("because")) {
      hints.push('Thêm một câu "because..." để nói rõ lý do.');
    }
    if (!normalized.includes("for example") && !normalized.includes("example")) {
      hints.push("Thêm một ví dụ cụ thể để ý của bạn chắc hơn.");
    }
    if (trimmed.length > 0 && trimmed.length < 40) {
      hints.push("Nói rõ thêm một ý để lập luận đầy hơn.");
    }
    return hints.slice(0, 2);
  }

  if (activity === "Free Talk") {
    const hints: string[] = [];
    if (trimmed.length > 0 && trimmed.length < 40) {
      hints.push("Nói rõ hơn một ý mà bạn thấy quan trọng nhất lúc này.");
    }
    if (!normalized.includes("hôm nay") && !normalized.includes("lúc này")) {
      hints.push("Thêm một chi tiết thật để câu nói tự nhiên hơn.");
    }
    return hints.slice(0, 2);
  }

  if (activity === "Inner Work") {
    const hints: string[] = [];
    const hasEmotionWord =
      normalized.includes("cảm") ||
      normalized.includes("lo") ||
      normalized.includes("buồn") ||
      normalized.includes("vui") ||
      normalized.includes("căng");
    if (!hasEmotionWord) {
      hints.push("Gọi tên cảm xúc chính của bạn trước.");
    }
    if (!normalized.includes("cần")) {
      hints.push("Thêm một câu về điều bạn đang cần lúc này.");
    }
    return hints.slice(0, 2);
  }

  if (activity === "Mentor") {
    const hints: string[] = [];
    if (!normalized.includes("mục tiêu") && !normalized.includes("goal")) {
      hints.push("Nói rõ mục tiêu bạn muốn đạt.");
    }
    if (!normalized.includes("trở ngại") && !normalized.includes("obstacle")) {
      hints.push("Nêu một trở ngại cụ thể đang chặn bạn.");
    }
    if (!normalized.includes("bước") && !normalized.includes("next")) {
      hints.push("Chốt một bước tiếp theo bạn sẽ làm ngay.");
    }
    return hints.slice(0, 2);
  }

  const hints: string[] = [];
  if (trimmed.length > 0 && trimmed.length < 30) {
    hints.push("Thêm một chi tiết nữa.");
  }
  if (!normalized.includes("because")) {
    hints.push('Thêm "because..." để nói rõ lý do.');
  }
  if (
    normalized.includes("because") &&
    !normalized.includes("for example") &&
    !normalized.includes("example")
  ) {
    hints.push("Ổn rồi — thêm một ví dụ nữa.");
  }
  return hints.slice(0, 2);
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const VOICE_STORAGE_KEY = "woo_voice_practice_v1";

function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ] as const;
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function ConversationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const activity = searchParams.get("activity") ?? "Inner Work";
  const scenarioId = searchParams.get("scenario");
  const scenario = getWorkScenario(scenarioId);
  const mode = searchParams.get("mode");
  const isQuickMode = mode === "quick";
  const quickScenario = isQuickMode
    ? getQuickScenario(scenarioId) ?? getQuickScenario("unhappy-customer-quick")
    : null;

  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;
  const last = searchParams.get("last") ?? "";
  const previousImprovement = searchParams.get("well") ?? "";

  const [selectedTone, setSelectedTone] = useState<WorkScenarioTone>("formal");
  const toneLabel: Record<WorkScenarioTone, string> = {
    formal: "Trang trọng",
    neutral: "Trung tính",
    friendly: "Thân thiện",
  };
  const [answer, setAnswer] = useState("");
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fallbackQuestion =
    mockConversation.find((message) => message.role === "coach")?.text ??
    "Lúc này bạn đang thấy thế nào?";

  const questionLevel = growthCount >= 4 ? 2 : growthCount >= 2 ? 1 : 0;
  const activityQuestionSet = ACTIVITY_QUESTIONS[activity];
  const activityQuestion =
    activityQuestionSet?.[questionLevel] ??
    activityQuestionSet?.[0] ??
    fallbackQuestion;

  const framing = scenario
    ? `Trọng tâm: ${scenario.focus}`
    : (ACTIVITY_FRAMING[activity] ??
      "Trọng tâm: nói thật, nói rõ điều mình muốn.");

  const supportText = scenario
    ? scenario.context
    : (ACTIVITY_SUPPORT_TEXT[activity] ??
      "Hít thở một nhịp, rồi nói: chuyện gì đã xảy ra, vì sao quan trọng, và một ví dụ thật.");

  const placeholder = scenario
    ? scenario.id === "delay-client"
      ? "Viết một tin nhắn ngắn, rõ và vẫn giữ được uy tín..."
      : scenario.id === "unhappy-customer"
        ? "Viết một phản hồi bình tĩnh, thấu cảm và có hướng xử lý..."
        : "Viết một lời xin thêm thời gian rõ ràng và chắc chắn..."
    : (ACTIVITY_PLACEHOLDER[activity] ?? "Viết câu trả lời của bạn...");

  const activityIcon = scenario ? "🧭" : (ACTIVITY_ICON[activity] ?? "✨");
  const activityLabelVi = ACTIVITY_LABEL_VI[activity] ?? "Bài luyện";
  const activityAccent = scenario
    ? "text-amber-200"
    : (ACTIVITY_ACCENT[activity] ?? "text-neutral-300");

  const helpfulWords = scenario
    ? scenario.helpfulWords
    : (ACTIVITY_HELPFUL_WORDS[activity] ?? [
        "rõ ý",
        "because",
        "for example",
        "bước tiếp theo",
      ]);

  const starterSentences = scenario
    ? scenario.starterSentences
    : ["Ý của mình là...", "Mình nghĩ vậy vì...", "Ví dụ là..."];

  const sampleAnswer = scenario
    ? scenario.sampleAnswer
    : (ACTIVITY_SAMPLE_ANSWER[activity] ??
      "Mình muốn cải thiện phần này vì nó quan trọng với mình. Ví dụ, hôm nay mình có thể làm một bước nhỏ.");

  const mainQuestion = isQuickMode
    ? (quickScenario?.prompt ?? "Trả lời rõ trong 1-2 câu.")
    : scenario
      ? scenario.question
      : activityQuestion;
  const difficultyLabel = getDifficultyLabel(growthCount);
  const liveHints = buildLiveHints(answer, scenarioId, activity);

  function insertText(text: string) {
    setAnswer(text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const length = text.length;
      textareaRef.current?.setSelectionRange(length, length);
    });
  }

  async function toggleVoiceRecording() {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        recordedBlobRef.current = blob;
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      };

      recorder.start(200);
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }

  function playYourRecording(rate = 1) {
    if (!audioUrl) return;
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(audioUrl);
    audio.playbackRate = rate;
    playbackAudioRef.current = audio;
    void audio.play();
  }

  function resetRecording() {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    recordedBlobRef.current = null;
    mediaChunksRef.current = [];
    setIsRecording(false);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeAnswer = answer.trim().slice(0, 800);

    const base = scenario
      ? `/feedback?scenario=${encodeURIComponent(scenario.id)}`
      : `/feedback?activity=${encodeURIComponent(activity)}`;

    const toneParam = scenario
      ? `&tone=${encodeURIComponent(selectedTone)}`
      : "";
    const modeParam = isQuickMode ? "&mode=quick" : "";

    if (recordedBlobRef.current) {
      try {
        const dataUrl = await blobToDataUrl(recordedBlobRef.current);
        sessionStorage.setItem(VOICE_STORAGE_KEY, dataUrl);
      } catch {
        sessionStorage.removeItem(VOICE_STORAGE_KEY);
      }
    } else {
      sessionStorage.removeItem(VOICE_STORAGE_KEY);
    }

    router.push(
      `${base}&growth=${growthCount}&last=${encodeURIComponent(last)}&answer=${encodeURIComponent(safeAnswer)}${toneParam}${modeParam}`,
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b1d] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_2%),radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.06),transparent_2%),radial-gradient(circle_at_55%_70%,rgba(255,255,255,0.05),transparent_2%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] p-6 backdrop-blur-md shadow-[0_12px_36px_rgba(4,10,30,0.35)]"
      >
        <p className={`text-xs ${activityAccent}`}>
          {scenario
            ? `Tình huống: ${activityIcon} ${scenario.title}`
            : `Bài luyện hiện tại: ${activityIcon} ${activityLabelVi}`}
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-neutral-300">Tiếp tục nhé — bạn đang làm rất tốt</p>
          {previousImprovement ? (
            <p className="text-xs text-neutral-400">
              Tiến bộ gần nhất: {previousImprovement}
            </p>
          ) : null}
        </div>

        {isQuickMode ? (
          <>
            <p className="text-xs text-neutral-400">Tình huống</p>
            <p className="text-sm text-neutral-300">
              {quickScenario?.situation ?? supportText}
            </p>
            <h1 className="text-base text-neutral-100">{mainQuestion}</h1>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-300">{framing}</p>
            <p className="text-xs text-neutral-400">
              Mức độ: {difficultyLabel}
            </p>
            <h1 className="text-lg text-neutral-100">{mainQuestion}</h1>
            <p className="text-sm text-neutral-300">{supportText}</p>
          </>
        )}

        {!isQuickMode && scenario ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-neutral-400">
              Chọn cách bạn muốn thể hiện
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["formal", "neutral", "friendly"] as WorkScenarioTone[]).map(
                (tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => {
                      setSelectedTone(tone);
                      insertText(scenario.toneStarters[tone]);
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm backdrop-blur-sm transition ${
                      selectedTone === tone
                        ? "border-amber-300/40 bg-[rgba(244,197,66,0.15)] text-amber-100"
                        : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                    }`}
                  >
                    {toneLabel[tone]}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : !isQuickMode ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-neutral-400">Bạn có thể bắt đầu như sau</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {starterSentences.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => insertText(starter)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!isQuickMode ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
          <p className="text-xs text-neutral-400">Từ gợi ý</p>
          <p className="mt-1 text-sm text-neutral-300">
            {helpfulWords.join(" • ")}
          </p>
          </div>
        ) : null}

        {!isQuickMode ? (
          <button
          type="button"
          onClick={() => setShowSampleAnswer((prev) => !prev)}
          className="w-fit rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10"
        >
          {showSampleAnswer ? "Ẩn câu mẫu" : "Xem câu mẫu"}
          </button>
        ) : null}

        {!isQuickMode && showSampleAnswer ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-400">Câu mẫu</p>
              <button
                type="button"
                onClick={() => speakText(sampleAnswer)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                🔊 Nghe
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-300">{sampleAnswer}</p>
          </div>
        ) : null}

        {!isQuickMode ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
          <p className="text-xs text-neutral-400">
            Cứ bình tĩnh. Bạn có thể bắt đầu bằng một từ.
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {liveHints.map((hint) => (
              <p key={hint} className="text-sm text-yellow-200">
                {hint}
              </p>
            ))}
            {answer.trim().length >= 80 ? (
              <p className="text-sm text-emerald-200">Ổn rồi — nói tiếp đi.</p>
            ) : null}
          </div>
          </div>
        ) : null}

        <p className="text-xs text-neutral-400">Câu trả lời của bạn</p>

        <textarea
          ref={textareaRef}
          name="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={isQuickMode ? 3 : 6}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/15 bg-[rgba(40,56,116,0.5)] px-5 py-3.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-400 shadow-inner shadow-black/20 focus:border-[#F4C542]/85 focus:ring-2 focus:ring-[#F4C542]/30 focus:shadow-[0_0_22px_rgba(244,197,66,0.16)]"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleVoiceRecording()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10"
          >
            {isRecording ? "🔴 Đang thu âm..." : "🎙️ Thu âm giọng của bạn"}
          </button>
          {audioUrl ? (
            <>
              <button
                type="button"
                onClick={() => playYourRecording(1)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                ▶️ Nghe lại giọng của bạn
              </button>
              <button
                type="button"
                onClick={resetRecording}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                🔁 Làm lại
              </button>
            </>
          ) : null}
        </div>

        {!isQuickMode && audioUrl ? (
          <div className="rounded-2xl border border-white/10 bg-[rgba(20,30,70,0.45)] px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-neutral-400">Nghe và chú ý</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
              <li>Nhấn trọng âm: nhấn vào từ khóa.</li>
              <li>Âm cuối: đừng nuốt âm &quot;t&quot; hoặc &quot;s&quot;.</li>
              <li>Độ mượt: hạn chế ngắt quá nhiều giữa các từ.</li>
            </ul>
          </div>
        ) : null}

        {!isQuickMode && audioUrl ? (
          <p className="text-xs text-neutral-400">
            Điều này rất bình thường. Tiến bộ bắt đầu khi bạn nghe ra khoảng cách.
          </p>
        ) : null}

        {!isQuickMode && audioUrl ? (
          <p className="text-xs text-neutral-400">
            Nói lại lần nữa — lần này rõ hơn.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isRecording}
          className="w-fit rounded-xl bg-[#F4C542] px-5 py-2 text-sm font-semibold text-[#1B1B1B] shadow-[0_0_20px_rgba(244,197,66,0.18)] transition hover:bg-[#FFD45A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </main>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-10" />}>
      <ConversationContent />
    </Suspense>
  );
}
