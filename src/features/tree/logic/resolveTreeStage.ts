export type TreeStage = "seed" | "sprout" | "tree";

export type TreeStageState = {
  stage: TreeStage;
  emoji: string;
  identityCopy: string;
  glow: boolean;
  message: string;
};

export function resolveTreeStage(growthCount: number): TreeStageState {
  if (growthCount >= 3) {
    return {
      stage: "tree",
      emoji: "🌳",
      identityCopy: "Bạn đang nói rõ ràng và tự tin hơn",
      message: "Cây của bạn đang lớn mạnh và vững vàng.",
      glow: true,
    };
  }

  if (growthCount >= 1) {
    return {
      stage: "sprout",
      emoji: "🌿",
      identityCopy: "Bạn đang nói tự tin hơn từng ngày",
      message: "Cây của bạn đang lớn lên mạnh mẽ hơn.",
      glow: true,
    };
  }

  return {
    stage: "seed",
    emoji: "🌱",
    identityCopy: "Bạn đang bắt đầu tìm thấy tiếng nói của mình",
    message: "Những bước nhỏ tạo nên trưởng thành thật sự.",
    glow: false,
  };
}
