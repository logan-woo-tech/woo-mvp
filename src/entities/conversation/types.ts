export type ConversationRole = "learner" | "coach";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  text: string;
};
