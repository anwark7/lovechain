"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/format";

interface CountdownProps {
  /** Unix timestamp (seconds) to count down to. */
  target: bigint;
  prefix?: string;
  elapsedLabel?: string;
}

/** Live-updating countdown to a unix timestamp. */
export function Countdown({ target, prefix, elapsedLabel = "ready" }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const value = countdown(target, now);
  const isElapsed = value === "elapsed";

  return (
    <span className={isElapsed ? "text-emerald-300" : "text-rose-50/80"}>
      {prefix ? `${prefix} ` : ""}
      {isElapsed ? elapsedLabel : value}
    </span>
  );
}
