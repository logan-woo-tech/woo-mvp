import type { ConversationViewState } from "../types";

export function getConversationViewState(messageCount: number): ConversationViewState {
  return { messageCount };
}
