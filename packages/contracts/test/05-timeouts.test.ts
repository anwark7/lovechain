import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployFixture,
  activeDeal,
  increaseTime,
  Status,
  OutcomeEnum,
  CHALLENGE,
  DEPOSIT,
  BOND,
  EVIDENCE_URI,
  netAfterFee,
  Ctx,
} from "./helpers";

const EXPIRED_FEE_BPS = 50n;
const SHORT_DURATION = 100; // seconds

describe("Timeouts / safety nets", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await loadFixture(deployFixture);
  });

  describe("claimByTimeout (unilateral expiry)", () => {
    it("lets a partner force EXPIRED after duration and returns deposits net 0.5%", async () => {
      const id = await activeDeal(ctx, { duration: SHORT_DURATION });
      await expect(
        ctx.love.connect(ctx.alice).claimByTimeout(id)
      ).to.be.revertedWithCustomError(ctx.love, "NotYetExpired");

      await increaseTime(SHORT_DURATION + 1);
      await expect(ctx.love.connect(ctx.alice).claimByTimeout(id)).to.emit(
        ctx.love,
        "ContractExpired"
      );
      const c = await ctx.love.getContract(id);
      expect(c.status).to.equal(Status.EXPIRED);
      expect(c.outcome).to.equal(OutcomeEnum.EXPIRED);

      const expected = netAfterFee(DEPOSIT, EXPIRED_FEE_BPS);
      expect(await ctx.love.claimableAmount(id, ctx.alice.address)).to.equal(expected);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await expect(ctx.love.connect(ctx.alice).withdraw()).to.changeEtherBalance(
        ctx.alice,
        expected
      );
    });

    it("works even if the other partner disappears (only one claims)", async () => {
      const id = await activeDeal(ctx, { duration: SHORT_DURATION });
      await increaseTime(SHORT_DURATION + 1);
      await ctx.love.connect(ctx.bob).claimByTimeout(id);
      // Bob alone can recover his deposit without Alice acting.
      await ctx.love.connect(ctx.bob).claimPayout(id);
      const expected = netAfterFee(DEPOSIT, EXPIRED_FEE_BPS);
      await expect(ctx.love.connect(ctx.bob).withdraw()).to.changeEtherBalance(ctx.bob, expected);
    });

    it("is callable from a stuck wedding request state", async () => {
      const id = await activeDeal(ctx, { duration: SHORT_DURATION });
      await ctx.love.connect(ctx.alice).requestWeddingUnlock(id, "ipfs://x");
      await increaseTime(SHORT_DURATION + 1);
      await ctx.love.connect(ctx.alice).claimByTimeout(id);
      expect((await ctx.love.getContract(id)).status).to.equal(Status.EXPIRED);
    });

    it("only a partner can trigger it", async () => {
      const id = await activeDeal(ctx, { duration: SHORT_DURATION });
      await increaseTime(SHORT_DURATION + 1);
      await expect(
        ctx.love.connect(ctx.outsider).claimByTimeout(id)
      ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    });

    it("cannot expire a disputed contract via claimByTimeout", async () => {
      const id = await activeDeal(ctx, { duration: SHORT_DURATION });
      await ctx.love.connect(ctx.alice).raiseBreachClaim(id, EVIDENCE_URI, { value: BOND });
      await increaseTime(SHORT_DURATION + 1);
      await expect(
        ctx.love.connect(ctx.alice).claimByTimeout(id)
      ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
    });
  });

  describe("resolveBreachByTimeout", () => {
    it("auto-validates an UNCHALLENGED claim after the window", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).raiseBreachClaim(id, EVIDENCE_URI, { value: BOND });
      await increaseTime(CHALLENGE + 1);
      await expect(ctx.love.resolveBreachByTimeout(id))
        .to.emit(ctx.love, "BreachResolved")
        .withArgs(id, true);
      expect((await ctx.love.getContract(id)).outcome).to.equal(OutcomeEnum.BREACH_VALID);
    });

    it("auto-rejects a CHALLENGED claim that never reached threshold", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).raiseBreachClaim(id, EVIDENCE_URI, { value: BOND });
      await ctx.love.connect(ctx.bob).challengeBreachClaim(id);
      await ctx.love.connect(ctx.witnesses[0]).voteDispute(id, true); // only 1/5
      await increaseTime(CHALLENGE + 1);
      await expect(ctx.love.resolveBreachByTimeout(id))
        .to.emit(ctx.love, "BreachResolved")
        .withArgs(id, false);
      expect((await ctx.love.getContract(id)).outcome).to.equal(OutcomeEnum.BREACH_REJECTED);
    });

    it("cannot run before the window closes", async () => {
      const id = await activeDeal(ctx);
      await ctx.love.connect(ctx.alice).raiseBreachClaim(id, EVIDENCE_URI, { value: BOND });
      await expect(
        ctx.love.resolveBreachByTimeout(id)
      ).to.be.revertedWithCustomError(ctx.love, "WindowStillOpen");
    });
  });
});
