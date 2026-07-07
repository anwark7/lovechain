// Mirrors the on-chain ContractStatus enum (order MUST match LoveChain.sol).
export enum ContractStatus {
  PENDING_PARTNER = 0,
  ACTIVE = 1,
  WEDDING_REQUESTED = 2,
  MARRIAGE_CONFIRMED = 3,
  BREAKUP_REQUESTED = 4,
  COOLING_PERIOD = 5,
  DISPUTED = 6,
  RESOLVED = 7,
  CANCELLED = 8,
  EXPIRED = 9,
}

// Mirrors the on-chain Outcome enum.
export enum Outcome {
  NONE = 0,
  WEDDING = 1,
  PEACEFUL = 2,
  BREACH_VALID = 3,
  BREACH_REJECTED = 4,
  EXPIRED = 5,
}

export const STATUS_LABEL: Record<ContractStatus, string> = {
  [ContractStatus.PENDING_PARTNER]: "Pending Partner",
  [ContractStatus.ACTIVE]: "Active",
  [ContractStatus.WEDDING_REQUESTED]: "Wedding Requested",
  [ContractStatus.MARRIAGE_CONFIRMED]: "Married 💍",
  [ContractStatus.BREAKUP_REQUESTED]: "Breakup Requested",
  [ContractStatus.COOLING_PERIOD]: "Cooling Period",
  [ContractStatus.DISPUTED]: "Disputed ⚠️",
  [ContractStatus.RESOLVED]: "Resolved",
  [ContractStatus.CANCELLED]: "Cancelled",
  [ContractStatus.EXPIRED]: "Expired ⏳",
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  [Outcome.NONE]: "—",
  [Outcome.WEDDING]: "Wedding Unlock 💍",
  [Outcome.PEACEFUL]: "Peaceful Exit 🕊️",
  [Outcome.BREACH_VALID]: "Breach Upheld",
  [Outcome.BREACH_REJECTED]: "Breach Rejected",
  [Outcome.EXPIRED]: "Expired ⏳",
};

// Tone used by the StatusBadge primitive.
export type StatusTone = "neutral" | "active" | "warn" | "good" | "muted";

export const STATUS_TONE: Record<ContractStatus, StatusTone> = {
  [ContractStatus.PENDING_PARTNER]: "neutral",
  [ContractStatus.ACTIVE]: "active",
  [ContractStatus.WEDDING_REQUESTED]: "good",
  [ContractStatus.MARRIAGE_CONFIRMED]: "good",
  [ContractStatus.BREAKUP_REQUESTED]: "warn",
  [ContractStatus.COOLING_PERIOD]: "warn",
  [ContractStatus.DISPUTED]: "warn",
  [ContractStatus.RESOLVED]: "muted",
  [ContractStatus.CANCELLED]: "muted",
  [ContractStatus.EXPIRED]: "muted",
};

// Fee tiers in basis points (PRD §28.2) — display only; enforced on-chain.
export const FEE_TIERS = [
  { key: "wedding", label: "Wedding Unlock", bps: 25, emoji: "💍" },
  { key: "peaceful", label: "Peaceful Exit", bps: 50, emoji: "🕊️" },
  { key: "breach", label: "Breach / Breakup", bps: 100, emoji: "⚠️" },
  { key: "expired", label: "Expiry / Timeout", bps: 50, emoji: "⏳" },
] as const;

export const WITNESS_COUNT = 5;
export const WEDDING_THRESHOLD = 3; // of 5
export const BREACH_THRESHOLD = 4; // of 5
