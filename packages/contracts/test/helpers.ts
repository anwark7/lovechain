import { ethers } from "hardhat";
import { LoveChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export const COOLING = 180; // 3 min
export const CHALLENGE = 180; // 3 min
export const WEDDING_WINDOW = 180; // 3 min
export const BREACH_AWARD_BPS = 10_000n; // 100%

export const DEPOSIT = ethers.parseEther("1");
export const BOND = ethers.parseEther("0.1");
export const DURATION = 60 * 60 * 24 * 30; // 30 days
export const PROOF_URI = "ipfs://mock-wedding-proof";
export const EVIDENCE_URI = "ipfs://mock-breach-evidence";

export interface Ctx {
  love: LoveChain;
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner; // partner A
  bob: HardhatEthersSigner; // partner B
  witnesses: HardhatEthersSigner[]; // 5 witnesses
  outsider: HardhatEthersSigner; // non-party
  witnessAddrs: string[];
}

/**
 * Deploy LoveChain with the demo windows and 6 named signers plus 5 witnesses.
 */
export async function deployFixture(): Promise<Ctx> {
  const signers = await ethers.getSigners();
  const [owner, alice, bob, outsider, ...rest] = signers;
  const witnesses = rest.slice(0, 5);
  const witnessAddrs = await Promise.all(witnesses.map((w) => w.getAddress()));

  const Factory = await ethers.getContractFactory("LoveChain");
  const love = await Factory.deploy(COOLING, CHALLENGE, WEDDING_WINDOW, BREACH_AWARD_BPS);
  await love.waitForDeployment();

  return { love, owner, alice, bob, witnesses, outsider, witnessAddrs };
}

/** Create a contract as Alice (partner A) with a 1 ETH deposit. */
export async function createDeal(ctx: Ctx, opts?: { rules?: string[]; duration?: number }) {
  const { love, alice, bob, witnessAddrs } = ctx;
  const rules = opts?.rules ?? ["Weekly check-in", "No ghosting > 7 days"];
  const duration = opts?.duration ?? DURATION;
  const tx = await love
    .connect(alice)
    .createLoveContract(bob.address, duration, witnessAddrs, rules, { value: DEPOSIT });
  await tx.wait();
  return 0n; // first contract id
}

/** Create + accept -> ACTIVE. */
export async function activeDeal(ctx: Ctx, opts?: { duration?: number }) {
  const id = await createDeal(ctx, opts);
  await ctx.love.connect(ctx.bob).acceptContract(id, { value: DEPOSIT });
  return id;
}

/** Fast-forward EVM time by `seconds` and mine. */
export async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/** ContractStatus enum mirror (order must match the Solidity enum). */
export const Status = {
  PENDING_PARTNER: 0,
  ACTIVE: 1,
  WEDDING_REQUESTED: 2,
  MARRIAGE_CONFIRMED: 3,
  BREAKUP_REQUESTED: 4,
  COOLING_PERIOD: 5,
  DISPUTED: 6,
  RESOLVED: 7,
  CANCELLED: 8,
  EXPIRED: 9,
} as const;

/** Outcome enum mirror. */
export const OutcomeEnum = {
  NONE: 0,
  WEDDING: 1,
  PEACEFUL: 2,
  BREACH_VALID: 3,
  BREACH_REJECTED: 4,
  EXPIRED: 5,
} as const;

/** Net amount after taking `bps` fee from `amount`. */
export function netAfterFee(amount: bigint, bps: bigint): bigint {
  const fee = (amount * bps) / 10_000n;
  return amount - fee;
}
