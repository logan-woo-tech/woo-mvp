"use client";

import GrowthToast from "./GrowthToast";
import type { TreeStageState } from "../logic/resolveTreeStage";

type TreeViewProps = {
  tree: TreeStageState;
  growthCount: number;
  lastImprovement: string;
};

export default function TreeView({
  tree,
  growthCount,
  lastImprovement,
}: TreeViewProps) {
  const hasGrowth = tree.glow && growthCount > 0;
  const hasImprovement = Boolean(lastImprovement.trim());

  return (
    <div className="flex h-72 w-full flex-col items-center justify-center rounded-xl border border-neutral-800/90 bg-neutral-900/40 px-5 text-neutral-300">
      <div
        className="mb-2 min-h-11 text-center transition-opacity duration-300"
        style={{ opacity: hasImprovement ? 1 : 0.75 }}
      >
        {hasImprovement ? (
          <>
            <p className="text-sm font-semibold text-emerald-300">+1 Tiến bộ</p>
            <p className="text-xs text-emerald-200">Nghe rõ ràng hơn rồi</p>
          </>
        ) : null}
      </div>

      <div className="mb-2 min-h-6">
        <GrowthToast
          show={hasImprovement}
          text={`+1 Tiến bộ — ${lastImprovement.trim()}`}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div
          className={`absolute h-32 w-32 rounded-full bg-emerald-400/30 blur-2xl transition-all duration-500 ${
            hasGrowth ? "opacity-100" : "opacity-0"
          }`}
        />
        <p
          className="relative text-9xl transition-transform duration-500"
          style={{
            transform: "scale(1) translateY(-2px)",
            filter: "drop-shadow(0 0 24px rgba(120, 255, 180, 0.25))",
          }}
          aria-hidden="true"
        >
          {tree.emoji}
        </p>
      </div>

      <p className="mt-3 text-sm font-medium text-neutral-100">
        {tree.identityCopy}
      </p>
      <p className="mt-2 text-xs text-neutral-300">
        {hasImprovement
          ? "Bạn xử lý tình huống rõ ràng hơn."
          : "Mỗi vòng luyện có ý nghĩa đều giúp cây của bạn lớn lên."}
      </p>
    </div>
  );
}
