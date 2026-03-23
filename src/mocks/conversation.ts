import type { ConversationMessage } from "@/entities/conversation";

export const mockConversation: ConversationMessage[] = [
  { id: "msg-1", role: "coach", text: "How are you feeling today?" },
  { id: "msg-2", role: "learner", text: "A little uncertain, but ready." },
];
