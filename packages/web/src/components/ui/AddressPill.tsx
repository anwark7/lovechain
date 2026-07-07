import { shortAddress } from "@/lib/format";

interface AddressPillProps {
  address?: string;
  label?: string;
  you?: boolean;
}

/** Compact monospace address chip, optionally tagged as "you". */
export function AddressPill({ address, label, you }: AddressPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 font-mono text-xs text-rose-50/80">
      {label && <span className="text-rose-50/40">{label}</span>}
      {shortAddress(address)}
      {you && <span className="rounded bg-rose-500/25 px-1 text-[10px] text-rose-200">you</span>}
    </span>
  );
}
