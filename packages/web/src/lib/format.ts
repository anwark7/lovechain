import { formatEther } from "viem";
import type { Address } from "viem";

/** Shorten an address to 0x1234…abcd. */
export function shortAddress(addr?: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format wei to a trimmed ETH string, e.g. "1.25 ETH". */
export function formatEth(wei?: bigint, dp = 4): string {
  if (wei === undefined) return "—";
  const s = formatEther(wei);
  const [whole, frac = ""] = s.split(".");
  const trimmed = frac.slice(0, dp).replace(/0+$/, "");
  return `${whole}${trimmed ? "." + trimmed : ""} ETH`;
}

/** True if two addresses are the same (case-insensitive). */
export function sameAddress(a?: string, b?: string): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** Human countdown from now until a unix timestamp (seconds). */
export function countdown(targetUnixSeconds: bigint, nowMs: number): string {
  const target = Number(targetUnixSeconds) * 1000;
  const diff = target - nowMs;
  if (diff <= 0) return "elapsed";
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Time since a unix timestamp, e.g. "3m ago". */
export function timeAgo(unixSeconds: bigint, nowMs: number): string {
  if (unixSeconds === 0n) return "never";
  const diff = Math.floor(nowMs / 1000) - Number(unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export type { Address };
