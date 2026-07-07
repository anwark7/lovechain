import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployFixture,
  activeDeal,
  increaseTime,
  Status,
  OutcomeEnum,
  PROOF_URI,
  WEDDING_WINDOW,
  DEPOSIT,
  netAfterFee,
  Ctx,
} from "./helpers";

const WEDDING_FEE_BPS = 25n;

/** Have `n` witnesses approve a pending wedding. */
async function witnessesApprove(ctx: Ctx, id: bigint, n: number) {
  for (let i = 0; i < n; i++) {
    await ctx.love.connect(ctx.witnesses[i]).voteWedding(id);
  }
}

describe("Wedding Unlock", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await loadFixture(deployFixture);
  });

  it("requires a proof URI", async () => {
    const id = await activeDeal(ctx);
    await expect(
      ctx.love.connect(ctx.alice).requestWeddingUnlock(id, "")
    ).to.be.revertedWithCustomError(ctx.love, "MissingProof");
  });

  it("moves to WEDDING_REQUESTED and pre-confirms requester", async () => {
    const id = await activeDeal(ctx);
    await expect(ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI))
      .to.emit(ctx.love, "WeddingRequested")
      .withArgs(id, ctx.alice.address, PROOF_URI);
    const c = await ctx.love.getContract(id);
    expect(c.status).to.equal(Status.WEDDING_REQUESTED);
    expect(c.partnerAConfirmedWedding).to.equal(true);
    expect(c.partnerBConfirmedWedding).to.equal(false);
  });

  it("only a partner can request", async () => {
    const id = await activeDeal(ctx);
    await expect(
      ctx.love.connect(ctx.outsider).requestWeddingUnlock(id, PROOF_URI)
    ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
  });

  it("finalizes on both confirm + 3/5 approvals (order: confirm then vote)", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
    await ctx.love.connect(ctx.bob).confirmWedding(id);
    await witnessesApprove(ctx, id, 2);
    // Not yet finalized at 2 votes.
    expect((await ctx.love.getContract(id)).status).to.equal(Status.WEDDING_REQUESTED);
    // 3rd vote finalizes.
    await expect(ctx.love.connect(ctx.witnesses[2]).voteWedding(id))
      .to.emit(ctx.love, "WeddingUnlocked")
      .and.to.emit(ctx.love, "WeddingBadge");
    const c = await ctx.love.getContract(id);
    expect(c.status).to.equal(Status.MARRIAGE_CONFIRMED);
    expect(c.outcome).to.equal(OutcomeEnum.WEDDING);
  });

  it("finalizes when votes come first, then the second confirm (order: vote then confirm)", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
    await witnessesApprove(ctx, id, 3);
    // Still not finalized: bob hasn't confirmed.
    expect((await ctx.love.getContract(id)).status).to.equal(Status.WEDDING_REQUESTED);
    await ctx.love.connect(ctx.bob).confirmWedding(id);
    expect((await ctx.love.getContract(id)).status).to.equal(Status.MARRIAGE_CONFIRMED);
  });

  it("rejects double voting and non-witness votes", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
    await ctx.love.connect(ctx.witnesses[0]).voteWedding(id);
    await expect(
      ctx.love.connect(ctx.witnesses[0]).voteWedding(id)
    ).to.be.revertedWithCustomError(ctx.love, "AlreadyVoted");
    await expect(
      ctx.love.connect(ctx.outsider).voteWedding(id)
    ).to.be.revertedWithCustomError(ctx.love, "NotWitness");
  });

  it("pays each partner their deposit net of 0.25% on wedding", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
    await ctx.love.connect(ctx.bob).confirmWedding(id);
    await witnessesApprove(ctx, id, 3);

    const expected = netAfterFee(DEPOSIT, WEDDING_FEE_BPS);
    expect(await ctx.love.claimableAmount(id, ctx.alice.address)).to.equal(expected);
    await ctx.love.connect(ctx.alice).claimPayout(id);
    await expect(ctx.love.connect(ctx.alice).withdraw()).to.changeEtherBalance(ctx.alice, expected);
    // Fee accrued for both sides once both claim.
    await ctx.love.connect(ctx.bob).claimPayout(id);
    const feePerSide = (DEPOSIT * WEDDING_FEE_BPS) / 10_000n;
    expect(await ctx.love.accruedFees()).to.equal(feePerSide * 2n);
  });

  describe("wedding window timeout", () => {
    it("reverts to ACTIVE and clears state after the window", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
      await witnessesApprove(ctx, id, 2);
      await increaseTime(WEDDING_WINDOW + 1);

      await expect(ctx.love.expireWeddingRequest(id)).to.emit(ctx.love, "WeddingRequestExpired");
      const c = await ctx.love.getContract(id);
      expect(c.status).to.equal(Status.ACTIVE);
      expect(c.partnerAConfirmedWedding).to.equal(false);
      // Tally reset: a fresh request can be voted on again.
      expect(await ctx.love.hasVoted(id, ctx.witnessAddrs[0])).to.equal(false);
    });

    it("cannot expire while the window is still open", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
      await expect(
        ctx.love.expireWeddingRequest(id)
      ).to.be.revertedWithCustomError(ctx.love, "WindowStillOpen");
    });

    it("blocks confirm/vote after the window closes", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, PROOF_URI);
      await increaseTime(WEDDING_WINDOW + 1);
      await expect(
        ctx.love.connect(ctx.bob).confirmWedding(id)
      ).to.be.revertedWithCustomError(ctx.love, "WindowClosed");
      await expect(
        ctx.love.connect(ctx.witnesses[0]).voteWedding(id)
      ).to.be.revertedWithCustomError(ctx.love, "WindowClosed");
    });
  });
});
