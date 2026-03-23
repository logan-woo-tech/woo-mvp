export type ProgressNodeStatus = "locked" | "active" | "completed";

export type ProgressNode = {
  id: string;
  title: string;
  status: ProgressNodeStatus;
};
