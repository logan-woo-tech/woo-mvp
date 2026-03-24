"use client";

import { useEffect, useState } from "react";

type GrowthToastProps = {
  show: boolean;
  text: string;
};

export default function GrowthToast({ show, text }: GrowthToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none rounded-full border border-emerald-700/50 bg-emerald-950/60 px-3 py-1 text-xs text-emerald-200 backdrop-blur-sm">
      {text}
    </div>
  );
}
