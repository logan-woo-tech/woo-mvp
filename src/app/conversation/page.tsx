"use client";

import React, { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockConversation } from "../../mocks/conversation";
import {
  getWorkScenario,
  type WorkScenarioTone,
} from "../../mocks/workScenarios";

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

const ACTIVITY_HELPFUL_WORDS: Record<string, string[]> = {
  "Inner Work": ["feeling", "need", "tension", "calm", "honest"],
  Thinking: ["idea", "reason", "because", "for example", "result"],
  "Free Talk": ["today", "stuck", "energy", "truth", "release"],
  Mentor: ["goal", "obstacle", "step", "deadline", "commitment"],
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
  if (growthCount >= 4) return "Deep";
  if (growthCount >= 2) return "Standard";
  return "Simple";
}

function buildLiveHints(
  answer: string,
  scenarioId: string | null | undefined,
): string[] {
  const trimmed = answer.trim();
  const normalized = trimmed.toLowerCase();
  if (scenarioId === "delay-client") {
    const hints: string[] = [];
    if (!normalized.includes("because")) {
      hints.push("Explain the reason clearly.");
    }
    if (!normalized.includes("for example") && !normalized.includes("example")) {
      hints.push("Add one concrete example.");
    }
    return hints.slice(0, 2);
  }

  if (scenarioId === "unhappy-customer") {
    return [
      "Acknowledge the customer's frustration first.",
      "Then explain what you will do to fix it.",
    ];
  }

  if (scenarioId === "ask-more-time") {
    return [
      "Be clear about your new deadline.",
      "Avoid vague phrases like 'as soon as possible'.",
    ];
  }

  const hints: string[] = [];
  if (trimmed.length > 0 && trimmed.length < 30) {
    hints.push("Add one more detail.");
  }
  if (!normalized.includes("because")) {
    hints.push('Add "because..." to explain your reason.');
  }
  if (
    normalized.includes("because") &&
    !normalized.includes("for example") &&
    !normalized.includes("example")
  ) {
    hints.push("Good — now add one example.");
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

  const growthSignal = Number(searchParams.get("growth") ?? "0");
  const growthCount = Number.isFinite(growthSignal)
    ? Math.max(0, growthSignal)
    : 0;
  const last = searchParams.get("last") ?? "";

  const [selectedTone, setSelectedTone] = useState<WorkScenarioTone>("formal");
  const [answer, setAnswer] = useState("");
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fallbackQuestion =
    mockConversation.find((message) => message.role === "coach")?.text ??
    "How are you feeling right now?";

  const questionLevel = growthCount >= 4 ? 2 : growthCount >= 2 ? 1 : 0;
  const activityQuestionSet = ACTIVITY_QUESTIONS[activity];
  const activityQuestion =
    activityQuestionSet?.[questionLevel] ??
    activityQuestionSet?.[0] ??
    fallbackQuestion;

  const framing = scenario
    ? `Coach focus: ${scenario.focus}`
    : (ACTIVITY_FRAMING[activity] ??
      "Coach focus: speak with honesty and intention.");

  const supportText = scenario
    ? scenario.context
    : (ACTIVITY_SUPPORT_TEXT[activity] ??
      "Take a breath, then share: what happened, why it mattered, and one real example.");

  const placeholder = scenario
    ? "Write your response in a professional way..."
    : (ACTIVITY_PLACEHOLDER[activity] ?? "Write your answer here...");

  const activityIcon = scenario ? "🧭" : (ACTIVITY_ICON[activity] ?? "✨");
  const activityAccent = scenario
    ? "text-amber-200"
    : (ACTIVITY_ACCENT[activity] ?? "text-neutral-300");

  const helpfulWords = scenario
    ? scenario.helpfulWords
    : (ACTIVITY_HELPFUL_WORDS[activity] ?? [
        "clear",
        "because",
        "for example",
        "next step",
      ]);

  const starterSentences = scenario
    ? scenario.starterSentences
    : ["My idea is...", "I think this because...", "For example..."];

  const sampleAnswer = scenario
    ? scenario.sampleAnswer
    : (ACTIVITY_SAMPLE_ANSWER[activity] ??
      "I want to improve this area because it matters to me. For example, I can take one small step today.");

  const mainQuestion = scenario ? scenario.question : activityQuestion;
  const difficultyLabel = getDifficultyLabel(growthCount);
  const liveHints = buildLiveHints(answer, scenarioId);

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
      `${base}&growth=${growthCount}&last=${encodeURIComponent(last)}&answer=${encodeURIComponent(safeAnswer)}${toneParam}`,
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6"
      >
        <p className={`text-xs ${activityAccent}`}>
          {scenario
            ? `Scenario: ${activityIcon} ${scenario.title}`
            : `Current activity: ${activityIcon} ${activity}`}
        </p>

        <p className="text-xs text-neutral-300">{framing}</p>
        <p className="text-xs text-neutral-400">
          Difficulty: {difficultyLabel}
        </p>

        <h1 className="text-lg text-neutral-100">{mainQuestion}</h1>
        <p className="text-sm text-neutral-300">{supportText}</p>

        {scenario ? (
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-xs text-neutral-400">
              Choose how you want to sound
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
                    className={`rounded-lg border px-3 py-2 text-sm hover:bg-neutral-800/70 ${
                      selectedTone === tone
                        ? "border-amber-600 bg-amber-950/30 text-amber-100"
                        : "border-neutral-700 bg-neutral-900/50 text-neutral-200"
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-xs text-neutral-400">You can start like this</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {starterSentences.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => insertText(starter)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/70"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
          <p className="text-xs text-neutral-400">Helpful words</p>
          <p className="mt-1 text-sm text-neutral-300">
            {helpfulWords.join(" • ")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSampleAnswer((prev) => !prev)}
          className="w-fit rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/70"
        >
          {showSampleAnswer ? "Hide simple answer" : "Show me a simple answer"}
        </button>

        {showSampleAnswer ? (
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-400">Simple answer</p>
              <button
                type="button"
                onClick={() => speakText(sampleAnswer)}
                className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800/70"
              >
                🔊 Listen
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-300">{sampleAnswer}</p>
          </div>
        ) : null}

        <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
          <p className="text-xs text-neutral-400">
            Take your time. You can start with one word.
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {liveHints.map((hint) => (
              <p key={hint} className="text-sm text-yellow-200">
                {hint}
              </p>
            ))}
            {answer.trim().length >= 80 ? (
              <p className="text-sm text-emerald-200">Good — keep going.</p>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-neutral-400">Your answer</p>

        <textarea
          ref={textareaRef}
          name="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={6}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleVoiceRecording()}
            className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/70"
          >
            {isRecording ? "🔴 Recording..." : "🎙️ Record your voice"}
          </button>
          {audioUrl ? (
            <>
              <button
                type="button"
                onClick={() => playYourRecording(1)}
                className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/70"
              >
                ▶️ Listen to yourself
              </button>
              <button
                type="button"
                onClick={resetRecording}
                className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/70"
              >
                🔁 Try again
              </button>
            </>
          ) : null}
        </div>

        {audioUrl ? (
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/30 px-4 py-3">
            <p className="text-xs text-neutral-400">Listen for this</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
              <li>Stress: emphasize the key word</li>
              <li>Ending sounds: do not drop final &quot;t&quot; or &quot;s&quot;</li>
              <li>Flow: avoid stopping too often between words</li>
            </ul>
          </div>
        ) : null}

        {audioUrl ? (
          <p className="text-xs text-neutral-400">
            This is normal. Improvement starts when you hear the gap.
          </p>
        ) : null}

        {audioUrl ? (
          <p className="text-xs text-neutral-400">
            Say it again — this time more clearly.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isRecording}
          className="w-fit rounded-lg border border-neutral-600 bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
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
