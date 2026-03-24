export type WorkScenarioTone = "formal" | "neutral" | "friendly";
export type WorkScenarioId =
  | "delay-client"
  | "unhappy-customer"
  | "ask-more-time";

export type WorkScenario = {
  id: WorkScenarioId;
  title: string;
  shortLabel: string;
  description: string;
  focus: string;
  context: string;
  question: string;
  toneStarters: Record<WorkScenarioTone, string>;
  helpfulWords: string[];
  starterSentences: string[];
  sampleAnswer: string;
};

export const WORK_SCENARIOS: Record<WorkScenarioId, WorkScenario> = {
  "delay-client": {
    id: "delay-client",
    title: "Báo trễ deadline mà vẫn giữ uy tín",
    shortLabel: "Báo trễ deadline",
    description: "Báo trễ rõ ràng nhưng vẫn giữ được niềm tin.",
    focus: "Nói rõ lý do, chủ động xử lý, và chốt hướng giải quyết.",
    context:
      "Bạn đã hứa deadline nhưng đội đang bị trễ. Bạn cần báo cho khách mà không làm mất niềm tin.",
    question: "Bạn sẽ báo trễ như thế nào để khách vẫn tin tưởng?",
    toneStarters: {
      formal: "I’d like to update you on the timeline...",
      neutral: "We are slightly behind schedule because...",
      friendly: "Quick update — we’re a bit behind because...",
    },
    helpfulWords: [
      "delay",
      "timeline",
      "issue",
      "adjust",
      "deliver",
      "quality",
      "update",
    ],
    starterSentences: [
      "We are slightly behind because...",
      "The current situation is...",
      "To ensure quality, we will...",
    ],
    sampleAnswer:
      "We are slightly behind schedule because we found an issue during testing. For example, one key function did not perform as expected. To ensure quality, we suggest extending the timeline by two days and will keep you updated daily.",
  },
  "unhappy-customer": {
    id: "unhappy-customer",
    title: "Trả lời khách đang bực mà không làm căng hơn",
    shortLabel: "Khách đang bực",
    description: "Phản hồi bình tĩnh và kéo cuộc nói chuyện về hướng giải quyết.",
    focus: "Thừa nhận cảm xúc, chủ động xử lý, rồi chốt cách giải quyết.",
    context:
      "Khách hàng đang khó chịu vì dịch vụ hoặc vì bị trễ. Bạn cần trả lời mà không làm tình hình căng hơn.",
    question:
      "Bạn sẽ trả lời thế nào để hạ nhiệt và đưa cuộc nói chuyện về hướng giải quyết?",
    toneStarters: {
      formal: "I understand your concern and appreciate you bringing this up...",
      neutral: "I understand the issue and we are looking into it...",
      friendly: "I get why this is frustrating — let me help fix it...",
    },
    helpfulWords: [
      "understand",
      "concern",
      "frustrating",
      "resolve",
      "support",
      "fix",
      "update",
    ],
    starterSentences: [
      "I understand how you feel because...",
      "The issue happened because...",
      "We are fixing this by...",
    ],
    sampleAnswer:
      "I understand how frustrating this must be because the delay affected your plan. For example, your order did not arrive on time. We are fixing this now and will update you within the next hour.",
  },
  "ask-more-time": {
    id: "ask-more-time",
    title: "Xin thêm thời gian mà vẫn giữ được sự tin tưởng",
    shortLabel: "Xin thêm thời gian",
    description: "Xin thêm thời gian rõ ràng, không để người nghe thấy thiếu tự tin.",
    focus: "Nói thẳng lý do, giữ giọng chắc chắn, và chốt deadline mới rõ ràng.",
    context:
      "Bạn không kịp deadline ban đầu và cần xin thêm thời gian nhưng vẫn phải giữ sự tin tưởng.",
    question: "Bạn sẽ xin thêm thời gian thế nào để vẫn chuyên nghiệp và đáng tin?",
    toneStarters: {
      formal: "I would like to request a slight extension on the deadline...",
      neutral: "I need a bit more time to complete this...",
      friendly: "Quick note — I may need a little more time on this...",
    },
    helpfulWords: [
      "deadline",
      "extension",
      "complete",
      "finalize",
      "quality",
      "deliver",
      "timeline",
    ],
    starterSentences: [
      "I need more time because...",
      "The current situation is...",
      "I can deliver this by...",
    ],
    sampleAnswer:
      "I need a bit more time because I am finalizing the last details. For example, I am still validating the final output to ensure quality. I can deliver the completed version by tomorrow at 4 PM.",
  },
};

export function getWorkScenario(
  scenarioId: string | null | undefined,
): WorkScenario | null {
  if (!scenarioId) return null;
  return WORK_SCENARIOS[scenarioId as WorkScenarioId] ?? null;
}
