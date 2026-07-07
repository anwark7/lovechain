import type { Address } from "viem";
import type { ContractStatus, Outcome } from "@/constants/contract";

/** Mirror of the on-chain LoveContract struct (bigints for uint256). */
export interface Deal {
  id: bigint;
  partnerA: Address;
  partnerB: Address;
  depositA: bigint;
  depositB: bigint;
  createdAt: bigint;
  activatedAt: bigint;
  duration: bigint;
  lastCheckInA: bigint;
  lastCheckInB: bigint;
  weddingRequestedAt: bigint;
  coolingEndsAt: bigint;
  breakupRequestedBy: Address;
  status: ContractStatus;
  outcome: Outcome;
  partnerAConfirmedWedding: boolean;
  partnerBConfirmedWedding: boolean;
  partnerAClaimed: boolean;
  partnerBClaimed: boolean;
}

/** Mirror of the on-chain BreachClaim struct. */
export interface BreachClaim {
  claimant: Address;
  accused: Address;
  evidenceURI: string;
  bondAmount: bigint;
  createdAt: bigint;
  votingEndsAt: bigint;
  approveVotes: bigint;
  rejectVotes: bigint;
  challenged: boolean;
  resolved: boolean;
  exists: boolean;
}

/** The caller's role relative to a given deal. */
export type PartnerRole = "A" | "B" | "witness" | "outsider";
