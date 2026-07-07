import { ReactNode } from "react";

type Tone = "info" | "warn" | "error" | "success";

const TONE: Record<Tone, string> = {
  info: "bg-white/5 border-white/10 text-rose-50/80",
  warn: "bg-amber-500/10 border-amber-400/30 text-amber-200",
  error: "bg-red-500/10 border-red-400/30 text-red-200",
  success: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
};

/** Inline banner for status / errors / disclaimers. */
export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${TONE[tone]}`}>{children}</div>
  );
}
