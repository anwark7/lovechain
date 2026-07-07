import { ReactNode } from "react";

/** Small labelled value used in detail grids. */
export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <div className="text-xs uppercase tracking-wide text-rose-50/40">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-rose-50">{children}</div>
    </div>
  );
}
