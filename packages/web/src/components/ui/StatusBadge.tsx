import { ContractStatus, STATUS_LABEL, STATUS_TONE, StatusTone } from "@/constants/contract";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-white/10 text-rose-50/80 border-white/15",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  good: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  muted: "bg-white/5 text-rose-50/50 border-white/10",
};

/** Colored pill showing a contract's lifecycle status. */
export function StatusBadge({ status }: { status: ContractStatus }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {STATUS_LABEL[status] ?? "Unknown"}
    </span>
  );
}
